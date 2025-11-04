-- Add sent_at column to anaji_scheduled_sms if it doesn't exist
ALTER TABLE public.anaji_scheduled_sms 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;