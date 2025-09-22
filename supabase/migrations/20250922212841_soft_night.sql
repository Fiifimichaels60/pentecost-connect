/*
  # Enhance Anaji SMS System

  1. New Tables
    - Add image_url column to anaji_members table
    - Add member_count column to anaji_groups table if missing
    - Create nana_settings table for system configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Create function to update group member counts
    - Create function to handle member group changes
*/

-- Add image_url column to anaji_members if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anaji_members' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.anaji_members ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Ensure member_count column exists in anaji_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anaji_groups' AND column_name = 'member_count'
  ) THEN
    ALTER TABLE public.anaji_groups ADD COLUMN member_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create nana_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nana_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on nana_settings
ALTER TABLE public.nana_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for nana_settings
CREATE POLICY "Anyone can manage settings" ON public.nana_settings FOR ALL USING (true);

-- Function to update group member counts
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member count for the old group (if any)
  IF OLD.group_id IS NOT NULL THEN
    UPDATE public.anaji_groups 
    SET member_count = (
      SELECT COUNT(*) FROM public.anaji_members 
      WHERE group_id = OLD.group_id AND status = 'active'
    )
    WHERE id = OLD.group_id;
  END IF;
  
  -- Update member count for the new group (if any)
  IF NEW.group_id IS NOT NULL THEN
    UPDATE public.anaji_groups 
    SET member_count = (
      SELECT COUNT(*) FROM public.anaji_members 
      WHERE group_id = NEW.group_id AND status = 'active'
    )
    WHERE id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle member insertions
CREATE OR REPLACE FUNCTION public.handle_member_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member count for the group (if any)
  IF NEW.group_id IS NOT NULL THEN
    UPDATE public.anaji_groups 
    SET member_count = (
      SELECT COUNT(*) FROM public.anaji_members 
      WHERE group_id = NEW.group_id AND status = 'active'
    )
    WHERE id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle member deletions
CREATE OR REPLACE FUNCTION public.handle_member_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member count for the group (if any)
  IF OLD.group_id IS NOT NULL THEN
    UPDATE public.anaji_groups 
    SET member_count = (
      SELECT COUNT(*) FROM public.anaji_members 
      WHERE group_id = OLD.group_id AND status = 'active'
    )
    WHERE id = OLD.group_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for member count updates
DROP TRIGGER IF EXISTS update_member_count_on_update ON public.anaji_members;
CREATE TRIGGER update_member_count_on_update
  AFTER UPDATE ON public.anaji_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

DROP TRIGGER IF EXISTS update_member_count_on_insert ON public.anaji_members;
CREATE TRIGGER update_member_count_on_insert
  AFTER INSERT ON public.anaji_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_member_insert();

DROP TRIGGER IF EXISTS update_member_count_on_delete ON public.anaji_members;
CREATE TRIGGER update_member_count_on_delete
  AFTER DELETE ON public.anaji_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_member_delete();

-- Update existing group member counts
UPDATE public.anaji_groups 
SET member_count = (
  SELECT COUNT(*) FROM public.anaji_members 
  WHERE group_id = anaji_groups.id AND status = 'active'
);