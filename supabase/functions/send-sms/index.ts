const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

    // Simulate SMS sending with realistic success rates
    let deliveredCount = 0;
    let failedCount = 0;
    const deliveryReports = [];

    for (const phone of recipients) {
      try {
        // Format phone number
        let formattedPhone = phone.replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+233' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+233') && !formattedPhone.startsWith('+')) {
          formattedPhone = '+233' + formattedPhone;
        }

        // Simulate SMS sending with 90% success rate
        const isSuccess = Math.random() > 0.1;
        const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (isSuccess) {
          deliveredCount++;
        } else {
          failedCount++;
        }

        deliveryReports.push({
          campaign_id: campaign.id,
          recipient_phone: formattedPhone,
          status: isSuccess ? 'delivered' : 'failed',
          delivery_time: isSuccess ? new Date().toISOString() : null,
          error_message: isSuccess ? null : 'Simulated delivery failure',
          provider_message_id: isSuccess ? messageId : null
        });

        console.log(`SMS to ${formattedPhone}: ${isSuccess ? 'delivered' : 'failed'}`);
      } catch (error) {
        console.error(`Failed to process SMS for ${phone}:`, error);
        failedCount++;
        deliveryReports.push({
          campaign_id: campaign.id,
          recipient_phone: phone,
          status: 'failed',
          error_message: error.message || 'Processing error'
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
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});