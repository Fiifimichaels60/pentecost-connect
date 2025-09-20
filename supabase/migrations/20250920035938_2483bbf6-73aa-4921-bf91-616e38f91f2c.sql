-- Create SMS campaigns table to track all SMS campaigns
CREATE TABLE public.anaji_sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('group', 'manual', 'single')),
  recipient_name TEXT NOT NULL,
  group_id UUID,
  recipients TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anaji_sms_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage SMS campaigns" 
ON public.anaji_sms_campaigns 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view SMS campaigns" 
ON public.anaji_sms_campaigns 
FOR SELECT 
USING (true);

-- Create trigger for timestamps
CREATE TRIGGER update_anaji_sms_campaigns_updated_at
BEFORE UPDATE ON public.anaji_sms_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create SMS delivery reports table for individual message tracking
CREATE TABLE public.anaji_sms_delivery_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.anaji_sms_campaigns(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  delivery_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  provider_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anaji_sms_delivery_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage delivery reports" 
ON public.anaji_sms_delivery_reports 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view delivery reports" 
ON public.anaji_sms_delivery_reports 
FOR SELECT 
USING (true);

-- Create trigger for timestamps
CREATE TRIGGER update_anaji_sms_delivery_reports_updated_at
BEFORE UPDATE ON public.anaji_sms_delivery_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();