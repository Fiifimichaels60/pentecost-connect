/*
  # Create SMS Campaigns and Delivery Reports Tables

  ## New Tables
  
  ### anaji_sms_campaigns
    - `id` (uuid, primary key) - Campaign identifier
    - `campaign_name` (text) - Name/title of the campaign
    - `message` (text) - SMS message content
    - `recipient_type` (text) - Type: 'single', 'group', 'manual'
    - `recipient_name` (text) - Name of recipient(s)
    - `group_id` (uuid, nullable) - Foreign key to anaji_groups if group campaign
    - `recipients` (text array) - Phone numbers of recipients
    - `recipient_count` (integer) - Total number of recipients
    - `delivered_count` (integer) - Number of successfully delivered messages
    - `failed_count` (integer) - Number of failed messages
    - `status` (text) - Campaign status: 'pending', 'sending', 'sent', 'failed'
    - `cost` (numeric) - Estimated/actual cost of campaign
    - `sent_at` (timestamptz) - When campaign was sent
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ### anaji_sms_delivery_reports
    - `id` (uuid, primary key) - Report identifier
    - `campaign_id` (uuid) - Foreign key to anaji_sms_campaigns
    - `recipient_phone` (text) - Recipient phone number
    - `status` (text) - Delivery status: 'delivered', 'failed', 'pending'
    - `provider_message_id` (text, nullable) - SMS provider's message ID
    - `error_message` (text, nullable) - Error message if delivery failed
    - `delivery_time` (timestamptz, nullable) - When message was delivered
    - `created_at` (timestamptz) - Record creation timestamp

  ## Security
    - Enable RLS on both tables
    - Add policies for authenticated access
*/

-- Create SMS campaigns table
CREATE TABLE IF NOT EXISTS public.anaji_sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('single', 'group', 'manual')),
  recipient_name TEXT NOT NULL,
  group_id UUID REFERENCES public.anaji_groups(id) ON DELETE SET NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  cost NUMERIC(10, 2) DEFAULT 0.00,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create SMS delivery reports table
CREATE TABLE IF NOT EXISTS public.anaji_sms_delivery_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.anaji_sms_campaigns(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'failed', 'pending')),
  provider_message_id TEXT,
  error_message TEXT,
  delivery_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anaji_sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_sms_delivery_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns
CREATE POLICY "Anyone can view campaigns"
  ON public.anaji_sms_campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create campaigns"
  ON public.anaji_sms_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON public.anaji_sms_campaigns
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
  ON public.anaji_sms_campaigns
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for delivery reports
CREATE POLICY "Anyone can view delivery reports"
  ON public.anaji_sms_delivery_reports
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage delivery reports"
  ON public.anaji_sms_delivery_reports
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON public.anaji_sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created_at ON public.anaji_sms_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_group_id ON public.anaji_sms_campaigns(group_id);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_campaign_id ON public.anaji_sms_delivery_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_status ON public.anaji_sms_delivery_reports(status);

-- Create trigger for updated_at on campaigns
DROP TRIGGER IF EXISTS update_anaji_sms_campaigns_updated_at ON public.anaji_sms_campaigns;
CREATE TRIGGER update_anaji_sms_campaigns_updated_at
  BEFORE UPDATE ON public.anaji_sms_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
