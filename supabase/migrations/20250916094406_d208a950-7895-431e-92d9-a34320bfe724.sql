-- Create nana_customers table
CREATE TABLE IF NOT EXISTS public.nana_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_messages INTEGER DEFAULT 0,
  last_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active'
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create nana_admin_users table
CREATE TABLE IF NOT EXISTS public.nana_admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nana_categories table
CREATE TABLE IF NOT EXISTS public.nana_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nana_order_items table
CREATE TABLE IF NOT EXISTS public.nana_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  food_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sms_templates table
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create message_groups table
CREATE TABLE IF NOT EXISTS public.message_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID,
  group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create nana_chat_messages table
CREATE TABLE IF NOT EXISTS public.nana_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nana_chats table
CREATE TABLE IF NOT EXISTS public.nana_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  admin_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nana_foods table
CREATE TABLE IF NOT EXISTS public.nana_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC NOT NULL,
  delivery_price NUMERIC NOT NULL DEFAULT 0,
  category_id UUID,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '{"view_history": true, "manage_admins": false, "manage_groups": true, "send_messages": true, "manage_members": true, "manage_templates": true}',
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_presence table
CREATE TABLE IF NOT EXISTS public.customer_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ejcon_admins table
CREATE TABLE IF NOT EXISTS public.ejcon_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  password TEXT NOT NULL DEFAULT 'admin123',
  permissions JSONB DEFAULT '{"manage_admins": false, "view_analytics": true, "manage_projects": true, "manage_appointments": true}',
  active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create members table
CREATE TABLE IF NOT EXISTS public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  group_id UUID,
  active BOOLEAN DEFAULT true,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create message_recipients table
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID,
  member_id UUID,
  status TEXT DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create nana_profiles table
CREATE TABLE IF NOT EXISTS public.nana_profiles (
  id UUID NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create nana_orders table
CREATE TABLE IF NOT EXISTS public.nana_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  order_type TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  notes TEXT,
  delivery_address TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sms_campaign_recipients table
CREATE TABLE IF NOT EXISTS public.sms_campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID,
  customer_id UUID,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sms_campaigns table
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_name TEXT DEFAULT 'BiteCraft',
  status TEXT DEFAULT 'pending',
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.nana_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejcon_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Allow all operations" ON public.nana_customers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_admin_users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.sms_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.message_groups FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_chat_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_chats FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_foods FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.admins FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.customer_presence FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.ejcon_admins FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.members FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.message_recipients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.groups FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.nana_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.sms_campaign_recipients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.sms_campaigns FOR ALL USING (true);