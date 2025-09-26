/*
  # Fix Anaji System Schema Issues

  1. Schema Updates
    - Add is_active column to anaji_groups table
    - Add is_active column to anaji_members table
    - Update existing data to use proper status values

  2. Data Migration
    - Set default values for new columns
    - Update existing records to maintain consistency

  3. Indexes
    - Add performance indexes for common queries
*/

-- Add is_active column to anaji_groups if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anaji_groups' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.anaji_groups ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add is_active column to anaji_members if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anaji_members' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.anaji_members ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing records to set is_active based on status
UPDATE public.anaji_groups SET is_active = true WHERE is_active IS NULL;
UPDATE public.anaji_members SET is_active = (status = 'active') WHERE is_active IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anaji_groups_active ON public.anaji_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_anaji_members_active ON public.anaji_members(is_active);
CREATE INDEX IF NOT EXISTS idx_anaji_members_group_id ON public.anaji_members(group_id);
CREATE INDEX IF NOT EXISTS idx_anaji_members_status ON public.anaji_members(status);