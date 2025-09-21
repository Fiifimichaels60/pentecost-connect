/*
  # Fix nana_profiles RLS infinite recursion

  1. New Columns
    - Add `is_admin` boolean column to `nana_profiles` table (defaults to false)
    - Add `email` column to `nana_profiles` table if missing
    - Add `region` column to `nana_profiles` table if missing

  2. Security Functions
    - Create `is_admin_user()` function to check admin status without RLS recursion
    - Function uses SECURITY DEFINER to bypass RLS for admin checks

  3. RLS Policy Updates
    - Drop existing problematic policies on `nana_profiles`
    - Create new policies that use the safe admin check function
    - Allow users to manage their own profiles
    - Allow admins to manage all profiles

  4. User Creation
    - Update `handle_new_user()` function to use `nana_profiles` table
    - Ensure proper profile creation on user signup
*/

-- Add missing columns to nana_profiles if they don't exist
DO $$
BEGIN
  -- Add is_admin column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nana_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.nana_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nana_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.nana_profiles ADD COLUMN email TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add region column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nana_profiles' AND column_name = 'region'
  ) THEN
    ALTER TABLE public.nana_profiles ADD COLUMN region TEXT;
  END IF;
END $$;

-- Create a safe function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.nana_profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own anaji profile" ON public.nana_profiles;
DROP POLICY IF EXISTS "Users can insert their own anaji profile" ON public.nana_profiles;
DROP POLICY IF EXISTS "Users can update their own anaji profile" ON public.nana_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.nana_profiles;

-- Create new safe RLS policies
CREATE POLICY "Users can view their own profile"
ON public.nana_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.nana_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.nana_profiles FOR UPDATE
USING (auth.uid() = id);

-- Admin policies using the safe function
CREATE POLICY "Admins can view all profiles"
ON public.nana_profiles FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admins can insert profiles"
ON public.nana_profiles FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update all profiles"
ON public.nana_profiles FOR UPDATE
USING (public.is_admin_user());

CREATE POLICY "Admins can delete profiles"
ON public.nana_profiles FOR DELETE
USING (public.is_admin_user());

-- Update the handle_new_user function to use nana_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.nana_profiles (id, email, first_name, last_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();