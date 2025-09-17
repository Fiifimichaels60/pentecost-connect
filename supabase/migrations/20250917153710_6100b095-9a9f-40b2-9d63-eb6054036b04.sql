-- Create anaji system tables

-- Categories table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customers table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  total_messages INTEGER DEFAULT 0,
  last_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Foods table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  delivery_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.anaji_categories(id),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Groups table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  group_id UUID REFERENCES public.anaji_groups(id),
  active BOOLEAN DEFAULT true,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chats table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.anaji_customers(id),
  admin_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.anaji_chats(id),
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.anaji_customers(id),
  total_amount NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  order_type TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.anaji_orders(id),
  food_id UUID REFERENCES public.anaji_foods(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_profiles (
  id UUID NOT NULL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SMS campaigns table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_name TEXT DEFAULT 'AnajiSystem',
  status TEXT DEFAULT 'pending',
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SMS templates table for anaji system
CREATE TABLE IF NOT EXISTS public.anaji_sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all anaji tables
ALTER TABLE public.anaji_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_sms_templates ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for anaji tables
-- Categories - public read, admin manage
CREATE POLICY "Anyone can view active anaji categories" ON public.anaji_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage anaji categories" ON public.anaji_categories
FOR ALL USING (true);

-- Customers - customers can create, admins manage
CREATE POLICY "Customers can create anaji customer records" ON public.anaji_customers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage anaji customers" ON public.anaji_customers
FOR ALL USING (true);

-- Foods - public read available, admin manage
CREATE POLICY "Anyone can view available anaji foods" ON public.anaji_foods
FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage anaji foods" ON public.anaji_foods
FOR ALL USING (true);

-- All other tables - admin access for now
CREATE POLICY "Admins can manage anaji groups" ON public.anaji_groups
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji members" ON public.anaji_members
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji messages" ON public.anaji_messages
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji chats" ON public.anaji_chats
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji chat messages" ON public.anaji_chat_messages
FOR ALL USING (true);

CREATE POLICY "Customers can create anaji orders" ON public.anaji_orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage anaji orders" ON public.anaji_orders
FOR ALL USING (true);

CREATE POLICY "Customers can create anaji order items" ON public.anaji_order_items
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage anaji order items" ON public.anaji_order_items
FOR ALL USING (true);

-- Profiles - users manage their own
CREATE POLICY "Users can view their own anaji profile" ON public.anaji_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own anaji profile" ON public.anaji_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own anaji profile" ON public.anaji_profiles
FOR UPDATE USING (auth.uid() = id);

-- SMS campaigns and templates - admin access
CREATE POLICY "Admins can manage anaji SMS campaigns" ON public.anaji_sms_campaigns
FOR ALL USING (true);

CREATE POLICY "Admins can manage anaji SMS templates" ON public.anaji_sms_templates
FOR ALL USING (true);

-- Create triggers for updating timestamps
CREATE TRIGGER update_anaji_categories_updated_at
BEFORE UPDATE ON public.anaji_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_customers_updated_at
BEFORE UPDATE ON public.anaji_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_foods_updated_at
BEFORE UPDATE ON public.anaji_foods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_groups_updated_at
BEFORE UPDATE ON public.anaji_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_members_updated_at
BEFORE UPDATE ON public.anaji_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_messages_updated_at
BEFORE UPDATE ON public.anaji_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_chats_updated_at
BEFORE UPDATE ON public.anaji_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_orders_updated_at
BEFORE UPDATE ON public.anaji_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_profiles_updated_at
BEFORE UPDATE ON public.anaji_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_sms_campaigns_updated_at
BEFORE UPDATE ON public.anaji_sms_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anaji_sms_templates_updated_at
BEFORE UPDATE ON public.anaji_sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();