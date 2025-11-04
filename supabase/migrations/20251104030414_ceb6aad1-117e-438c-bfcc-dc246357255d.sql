-- Create scheduled SMS table
CREATE TABLE public.anaji_scheduled_sms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  message TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('single', 'group', 'manual')),
  recipient_name TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  group_id UUID REFERENCES public.anaji_groups(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anaji_scheduled_sms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage scheduled SMS"
ON public.anaji_scheduled_sms
FOR ALL
USING (true);

CREATE POLICY "Anyone can view scheduled SMS"
ON public.anaji_scheduled_sms
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_anaji_scheduled_sms_updated_at
BEFORE UPDATE ON public.anaji_scheduled_sms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_anaji_scheduled_sms_status ON public.anaji_scheduled_sms(status);
CREATE INDEX idx_anaji_scheduled_sms_scheduled_date ON public.anaji_scheduled_sms(scheduled_date, scheduled_time);