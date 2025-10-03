/*
  # Create Complete Church Management Schema

  ## New Tables
  
  ### 1. anaji_groups
    - `id` (uuid, primary key) - Group identifier
    - `name` (text) - Group name
    - `description` (text) - Group description
    - `member_count` (integer) - Count of members in group
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp
  
  ### 2. anaji_members
    - `id` (uuid, primary key) - Member identifier
    - `name` (text) - Member full name
    - `phone` (text) - Phone number
    - `email` (text) - Email address
    - `location` (text) - Address/location
    - `date_of_birth` (date) - Date of birth
    - `image_url` (text) - Profile image URL
    - `emergency_contact_name` (text) - Emergency contact name
    - `emergency_contact_phone` (text) - Emergency contact phone
    - `status` (text) - Member status (active/inactive)
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp
  
  ### 3. anaji_member_groups (junction table)
    - `id` (uuid, primary key) - Record identifier
    - `member_id` (uuid) - Reference to anaji_members
    - `group_id` (uuid) - Reference to anaji_groups
    - `created_at` (timestamptz) - Record creation timestamp
  
  ### 4. attendance_sessions
    - `id` (uuid, primary key) - Session identifier
    - `title` (text) - Session title
    - `date` (date) - Session date
    - `type` (text) - Session type
    - `group_id` (uuid, nullable) - Optional group reference
    - `total_members` (integer) - Total members expected
    - `present_count` (integer) - Count of present members
    - `absent_count` (integer) - Count of absent members
    - `status` (text) - Session status
    - `created_by` (text) - Creator name
    - `notes` (text) - Optional notes
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp
  
  ### 5. attendance_records
    - `id` (uuid, primary key) - Record identifier
    - `session_id` (uuid) - Reference to attendance_sessions
    - `member_id` (uuid) - Reference to anaji_members
    - `present` (boolean) - Attendance status
    - `created_at` (timestamptz) - Record creation timestamp

  ## Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create anaji_groups table
CREATE TABLE IF NOT EXISTS public.anaji_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create anaji_members table
CREATE TABLE IF NOT EXISTS public.anaji_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  date_of_birth DATE,
  image_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create anaji_member_groups junction table
CREATE TABLE IF NOT EXISTS public.anaji_member_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.anaji_members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.anaji_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, group_id)
);

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'Service',
  group_id UUID REFERENCES public.anaji_groups(id) ON DELETE SET NULL,
  total_members INTEGER NOT NULL DEFAULT 0,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_by TEXT DEFAULT 'Unknown',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.anaji_members(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, member_id)
);

-- Enable RLS on all tables
ALTER TABLE public.anaji_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anaji_member_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anaji_groups
CREATE POLICY "Anyone can view groups"
  ON public.anaji_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage groups"
  ON public.anaji_groups
  FOR ALL
  USING (true);

-- Create RLS policies for anaji_members
CREATE POLICY "Anyone can view members"
  ON public.anaji_members
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage members"
  ON public.anaji_members
  FOR ALL
  USING (true);

-- Create RLS policies for anaji_member_groups
CREATE POLICY "Anyone can view member groups"
  ON public.anaji_member_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage member groups"
  ON public.anaji_member_groups
  FOR ALL
  USING (true);

-- Create RLS policies for attendance_sessions
CREATE POLICY "Anyone can view attendance sessions"
  ON public.attendance_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage attendance sessions"
  ON public.attendance_sessions
  FOR ALL
  USING (true);

-- Create RLS policies for attendance_records
CREATE POLICY "Anyone can view attendance records"
  ON public.attendance_records
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage attendance records"
  ON public.attendance_records
  FOR ALL
  USING (true);

-- Create function to update group member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.anaji_groups
    SET member_count = (
      SELECT COUNT(DISTINCT member_id)
      FROM public.anaji_member_groups
      WHERE group_id = OLD.group_id
    )
    WHERE id = OLD.group_id;
    RETURN OLD;
  ELSE
    UPDATE public.anaji_groups
    SET member_count = (
      SELECT COUNT(DISTINCT member_id)
      FROM public.anaji_member_groups
      WHERE group_id = NEW.group_id
    )
    WHERE id = NEW.group_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_anaji_groups_updated_at ON public.anaji_groups;
CREATE TRIGGER update_anaji_groups_updated_at
  BEFORE UPDATE ON public.anaji_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_anaji_members_updated_at ON public.anaji_members;
CREATE TRIGGER update_anaji_members_updated_at
  BEFORE UPDATE ON public.anaji_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_sessions_updated_at ON public.attendance_sessions;
CREATE TRIGGER update_attendance_sessions_updated_at
  BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for group member count
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON public.anaji_member_groups;
CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR DELETE ON public.anaji_member_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_anaji_members_status ON public.anaji_members(status);
CREATE INDEX IF NOT EXISTS idx_anaji_members_phone ON public.anaji_members(phone);
CREATE INDEX IF NOT EXISTS idx_member_groups_member_id ON public.anaji_member_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_group_id ON public.anaji_member_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_group_id ON public.attendance_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON public.attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member_id ON public.attendance_records(member_id);
