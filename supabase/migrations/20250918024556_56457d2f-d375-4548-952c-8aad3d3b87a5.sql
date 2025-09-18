-- Create anaji_groups table for SMS groups
CREATE TABLE public.anaji_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create anaji_members table for SMS contacts
CREATE TABLE public.anaji_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  group_id UUID REFERENCES public.anaji_groups(id) ON DELETE SET NULL,
  date_of_birth DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create anaji_history table for SMS history
CREATE TABLE public.anaji_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  recipients TEXT[] DEFAULT '{}',
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('individual', 'group', 'manual')),
  recipient_name TEXT NOT NULL,
  group_id UUID REFERENCES public.anaji_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_time TIME NOT NULL DEFAULT CURRENT_TIME,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.anaji_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anaji_groups
CREATE POLICY "Anyone can view groups" ON public.anaji_groups FOR SELECT USING (true);
CREATE POLICY "Admins can manage groups" ON public.anaji_groups FOR ALL USING (true);

-- Create RLS policies for anaji_members
CREATE POLICY "Anyone can view members" ON public.anaji_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage members" ON public.anaji_members FOR ALL USING (true);

-- Create RLS policies for anaji_history
CREATE POLICY "Anyone can view history" ON public.anaji_history FOR SELECT USING (true);
CREATE POLICY "Admins can manage history" ON public.anaji_history FOR ALL USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_anaji_groups_updated_at
  BEFORE UPDATE ON public.anaji_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_members_updated_at
  BEFORE UPDATE ON public.anaji_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_history_updated_at
  BEFORE UPDATE ON public.anaji_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();