import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log('Process scheduled SMS function invoked at:', new Date().toISOString());
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log('Current time:', now.toISOString());
    
    // Fetch scheduled messages that should be sent
    // We combine date and time for proper comparison
    const { data: scheduledMessages, error: fetchError } = await supabase
      .from('anaji_scheduled_sms')
      .select('*')
      .eq('status', 'scheduled');

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError);
      throw fetchError;
    }

    console.log('Found scheduled messages:', scheduledMessages?.length || 0);

    if (!scheduledMessages || scheduledMessages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No scheduled messages to process', processed: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Filter messages that are due to be sent
    const messagesToSend = scheduledMessages.filter((msg: any) => {
      // scheduled_time is already in format "HH:MM:SS", so no need to append ":00"
      const scheduledDateTime = new Date(`${msg.scheduled_date}T${msg.scheduled_time}`);
      console.log(`Message ${msg.id}: scheduled for ${scheduledDateTime.toISOString()}, now is ${now.toISOString()}, should send: ${scheduledDateTime <= now}`);
      return scheduledDateTime <= now;
    });

    console.log('Messages to send now:', messagesToSend.length);

    if (messagesToSend.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No messages due to be sent', processed: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const results = [];

    for (const scheduled of messagesToSend) {
      try {
        const { error: updateError } = await supabase
          .from('anaji_scheduled_sms')
          .update({ status: 'sending' })
          .eq('id', scheduled.id);

        if (updateError) throw updateError;

        const { data: settings, error: settingsError } = await supabase
          .from('nana_settings')
          .select('key, value')
          .in('key', ['hubtel_client_id', 'hubtel_client_secret', 'hubtel_sender_id']);

        if (settingsError) {
          console.error('Error fetching settings:', settingsError);
          throw new Error('Failed to fetch Hubtel API settings');
        }

        const clientId = settings?.find(s => s.key === 'hubtel_client_id')?.value;
        const clientSecret = settings?.find(s => s.key === 'hubtel_client_secret')?.value;
        const senderId = settings?.find(s => s.key === 'hubtel_sender_id')?.value;

        if (!clientId || !clientSecret || !senderId) {
          console.error('Missing Hubtel credentials');
          throw new Error('Hubtel credentials not configured');
        }

        console.log('Hubtel credentials loaded successfully');

        const { data: campaignData, error: campaignError } = await supabase
          .from('anaji_sms_campaigns')
          .insert({
            campaign_name: scheduled.campaign_name,
            message: scheduled.message,
            recipients: scheduled.recipients,
            recipient_type: scheduled.recipient_type,
            recipient_name: scheduled.recipient_name,
            recipient_count: scheduled.recipient_count,
            group_id: scheduled.group_id,
            status: 'sending',
          })
          .select()
          .single();

        if (campaignError) throw campaignError;

        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        let delivered = 0;
        let failed = 0;

        for (const recipient of scheduled.recipients) {
          try {
            const response = await fetch('https://api.hubtel.com/v1/messages/send', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                From: senderId,
                To: recipient,
                Content: scheduled.message,
              }),
            });

            const result = await response.json();

            if (response.ok && result.Status === 0) {
              delivered++;
              await supabase
                .from('anaji_sms_delivery_reports')
                .insert({
                  campaign_id: campaignData.id,
                  recipient_phone: recipient,
                  status: 'delivered',
                  provider_message_id: result.MessageId,
                  delivery_time: new Date().toISOString(),
                });
            } else {
              failed++;
              await supabase
                .from('anaji_sms_delivery_reports')
                .insert({
                  campaign_id: campaignData.id,
                  recipient_phone: recipient,
                  status: 'failed',
                  error_message: result.Message || 'Unknown error',
                });
            }
          } catch (err) {
            failed++;
            await supabase
              .from('anaji_sms_delivery_reports')
              .insert({
                campaign_id: campaignData.id,
                recipient_phone: recipient,
                status: 'failed',
                error_message: err.message,
              });
          }
        }

        await supabase
          .from('anaji_sms_campaigns')
          .update({
            status: 'sent',
            delivered_count: delivered,
            failed_count: failed,
            sent_at: new Date().toISOString(),
          })
          .eq('id', campaignData.id);

        await supabase
          .from('anaji_scheduled_sms')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', scheduled.id);

        results.push({
          id: scheduled.id,
          campaign_name: scheduled.campaign_name,
          delivered,
          failed,
        });
      } catch (err) {
        await supabase
          .from('anaji_scheduled_sms')
          .update({ status: 'failed' })
          .eq('id', scheduled.id);

        results.push({
          id: scheduled.id,
          campaign_name: scheduled.campaign_name,
          error: err.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: messagesToSend.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing scheduled SMS:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
