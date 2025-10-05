const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface SMSRequest {
  campaignName: string;
  message: string;
  recipients: string[];
  recipientType: 'group' | 'manual' | 'single';
  recipientName: string;
  groupId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignName, message, recipients, recipientType, recipientName, groupId }: SMSRequest = await req.json();

    console.log(`Starting SMS campaign: ${campaignName}`);
    console.log(`Recipients: ${recipients.length}, Type: ${recipientType}`);

    // Validate input
    if (!message || message.trim().length === 0) {
      throw new Error('Message content is required');
    }

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    if (recipients.length > 100) {
      throw new Error('Maximum 100 recipients allowed per campaign');
    }

    // Fetch Hubtel API credentials from nana_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('nana_settings')
      .select('key, value')
      .in('key', ['hubtel_client_id', 'hubtel_client_secret', 'hubtel_sender_id']);

    if (settingsError) {
      console.error('Error fetching Hubtel settings:', settingsError);
      throw new Error('Failed to fetch Hubtel API settings');
    }

const envClientId = Deno.env.get('hubtelClientId') || Deno.env.get('HUBTEL_CLIENT_ID');
const envClientSecret = Deno.env.get('hubtelClientSecret') || Deno.env.get('HUBTEL_CLIENT_SECRET');
const envSenderId = Deno.env.get('hubtelSenderId') || Deno.env.get('HUBTEL_SENDER_ID');

const hubtelClientId = envClientId || settings?.find(s => s.key === 'hubtel_client_id')?.value;
const hubtelClientSecret = envClientSecret || settings?.find(s => s.key === 'hubtel_client_secret')?.value;
const hubtelSenderId = envSenderId || settings?.find(s => s.key === 'hubtel_sender_id')?.value || 'Church';

if (!hubtelClientId || !hubtelClientSecret) {
  throw new Error('Hubtel API credentials not configured. Add hubtelClientId and hubtelClientSecret as Supabase secrets or set hubtel_client_id and hubtel_client_secret in Settings.');
}

    console.log('Hubtel credentials loaded successfully');

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('anaji_sms_campaigns')
      .insert({
        campaign_name: campaignName,
        message,
        recipient_type: recipientType,
        recipient_name: recipientName,
        group_id: groupId,
        recipients,
        recipient_count: recipients.length,
        status: 'sending',
        cost: recipients.length * Math.ceil(message.length / 160) * 0.05
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`);
    }

    console.log(`Campaign created with ID: ${campaign.id}`);

    // Send SMS using Hubtel API
    let deliveredCount = 0;
    let failedCount = 0;
    const deliveryReports = [];

    // Create Basic Auth header
    const authString = `${hubtelClientId}:${hubtelClientSecret}`;
    const base64Auth = btoa(authString);

    for (const phone of recipients) {
      try {
        // Format phone number for Hubtel (expects format: 233XXXXXXXXX without +)
        let formattedPhone = phone.replace(/\s+/g, '').replace(/\+/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '233' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('233')) {
          formattedPhone = '233' + formattedPhone;
        }

        console.log(`Sending SMS to ${formattedPhone}`);

        // Call Hubtel SMS API
        const hubtelResponse = await fetch('https://sms.hubtel.com/v1/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${base64Auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: hubtelSenderId,
            to: formattedPhone,
            content: message
          })
        });

        const hubtelResult = await hubtelResponse.json();
        console.log('Hubtel API Full Response:', JSON.stringify(hubtelResult, null, 2));
        console.log('Response Status Code:', hubtelResponse.status);
        console.log('Response OK:', hubtelResponse.ok);

        // Hubtel returns 200 status code with ResponseCode in the body
        // Success is ResponseCode: "0000" or status: 0
        const isSuccess = hubtelResponse.ok && (
          hubtelResult.ResponseCode === "0000" || 
          hubtelResult.status === 0 || 
          hubtelResult.Status === 0
        );

        if (isSuccess) {
          deliveredCount++;
          deliveryReports.push({
            campaign_id: campaign.id,
            recipient_phone: formattedPhone,
            status: 'delivered',
            delivery_time: new Date().toISOString(),
            provider_message_id: hubtelResult.MessageId || hubtelResult.messageId || hubtelResult.data?.messageId
          });
          console.log(`✓ SMS to ${formattedPhone}: delivered`);
        } else {
          failedCount++;
          const errorMessage = hubtelResult.Message || hubtelResult.message || hubtelResult.data?.message || JSON.stringify(hubtelResult);
          deliveryReports.push({
            campaign_id: campaign.id,
            recipient_phone: formattedPhone,
            status: 'failed',
            error_message: errorMessage
          });
          console.log(`✗ SMS to ${formattedPhone}: failed - ${errorMessage}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to send SMS to ${phone}:`, error);
        failedCount++;
        deliveryReports.push({
          campaign_id: campaign.id,
          recipient_phone: phone,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Network or API error'
        });
      }
    }

    // Batch insert delivery reports
    if (deliveryReports.length > 0) {
      const { error: reportsError } = await supabase
        .from('anaji_sms_delivery_reports')
        .insert(deliveryReports);

      if (reportsError) {
        console.error('Error saving delivery reports:', reportsError);
      }
    }

    // Update campaign with final results
    const { error: updateError } = await supabase
      .from('anaji_sms_campaigns')
      .update({
        status: 'sent',
        delivered_count: deliveredCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
    }

    console.log(`Campaign completed: ${deliveredCount} delivered, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      campaignId: campaign.id,
      totalSent: recipients.length,
      delivered: deliveredCount,
      failed: failedCount,
      message: `SMS campaign completed. ${deliveredCount} messages delivered, ${failedCount} failed.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-sms function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});