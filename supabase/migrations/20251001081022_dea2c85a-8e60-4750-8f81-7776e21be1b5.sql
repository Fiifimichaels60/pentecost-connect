-- Add emergency contact fields to anaji_members
ALTER TABLE public.anaji_members
ADD COLUMN emergency_contact_name text,
ADD COLUMN emergency_contact_phone text;

-- Create admin users table with roles and permissions
CREATE TABLE public.anaji_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'viewer',
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.anaji_admin_users ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all admins
CREATE POLICY "Super admins can manage all admins"
ON public.anaji_admin_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.anaji_admin_users
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- Admins can view all admins
CREATE POLICY "Admins can view all admins"
ON public.anaji_admin_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.anaji_admin_users
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_anaji_admin_users_updated_at
BEFORE UPDATE ON public.anaji_admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_anaji_admin_users_user_id ON public.anaji_admin_users(user_id);
CREATE INDEX idx_anaji_admin_users_email ON public.anaji_admin_users(email);
CREATE INDEX idx_anaji_admin_users_role ON public.anaji_admin_users(role);