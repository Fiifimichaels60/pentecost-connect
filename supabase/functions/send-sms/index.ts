import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const sendSMSViaHubtel = async (phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const hubtelApiKey = Deno.env.get('hubtelApiKey');
    const hubtelClientId = Deno.env.get('hubtelClientId');
    const hubtelClientSecret = Deno.env.get('hubtelClientSecret');
    
    if (!hubtelClientId || !hubtelClientSecret) {
      throw new Error('Hubtel credentials not configured');
    }

    // Format phone number (ensure it starts with +233)
    let formattedPhone = phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+233' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+233')) {
      formattedPhone = '+233' + formattedPhone;
    }

    console.log(`Sending SMS to ${formattedPhone}: ${message.substring(0, 50)}...`);

    const response = await fetch('https://smsc.hubtel.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${hubtelClientId}:${hubtelClientSecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: 'ANAJI ENG',
        To: formattedPhone,
        Content: message,
        RegisteredDelivery: true
      }),
    });

    const result = await response.json();
    console.log('Hubtel API response:', result);

    if (response.ok && result.MessageId) {
      return { success: true, messageId: result.MessageId };
    } else {
      return { success: false, error: result.Message || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('Error sending SMS via Hubtel:', error);
    return { success: false, error: error.message };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignName, message, recipients, recipientType, recipientName, groupId }: SMSRequest = await req.json();

    console.log(`Starting SMS campaign: ${campaignName} to ${recipients.length} recipients`);

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
        cost: recipients.length * 0.05 // 5 pesewas per SMS
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`);
    }

    console.log(`Campaign created with ID: ${campaign.id}`);

    // Send SMS to each recipient
    let deliveredCount = 0;
    let failedCount = 0;

    for (const phone of recipients) {
      try {
        const result = await sendSMSViaHubtel(phone, message);
        
        const deliveryStatus = result.success ? 'sent' : 'failed';
        if (result.success) {
          deliveredCount++;
        } else {
          failedCount++;
        }

        // Record delivery report
        await supabase
          .from('anaji_sms_delivery_reports')
          .insert({
            campaign_id: campaign.id,
            recipient_phone: phone,
            status: deliveryStatus,
            delivery_time: result.success ? new Date().toISOString() : null,
            error_message: result.error || null,
            provider_message_id: result.messageId || null
          });

        console.log(`SMS to ${phone}: ${deliveryStatus}`);
      } catch (error) {
        console.error(`Failed to send SMS to ${phone}:`, error);
        failedCount++;
        
        // Record failed delivery
        await supabase
          .from('anaji_sms_delivery_reports')
          .insert({
            campaign_id: campaign.id,
            recipient_phone: phone,
            status: 'failed',
            error_message: error.message
          });
      }
    }

    // Update campaign with final results
    await supabase
      .from('anaji_sms_campaigns')
      .update({
        status: 'sent',
        delivered_count: deliveredCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

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
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});