-- Create missing anaji tables to match the system requirements

-- Message groups table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_message_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.anaji_messages(id),
  group_id UUID REFERENCES public.anaji_groups(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message recipients table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.anaji_messages(id),
  member_id UUID REFERENCES public.anaji_members(id),
  status TEXT DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer presence table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_customer_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.anaji_customers(id) NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- SMS campaign recipients table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_sms_campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.anaji_sms_campaigns(id),
  customer_id UUID REFERENCES public.anaji_customers(id),
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.anaji_message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_customer_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_sms_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Admins can manage anaji message groups" ON public.anaji_message_groups
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji message recipients" ON public.anaji_message_recipients
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji customer presence" ON public.anaji_customer_presence
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji SMS campaign recipients" ON public.anaji_sms_campaign_recipients
FOR ALL USING (true);

-- Add triggers for timestamp updates
CREATE TRIGGER update_anaji_customer_presence_updated_at
BEFORE UPDATE ON public.anaji_customer_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();