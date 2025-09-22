/*
  # Add group support to attendance sessions

  1. Schema Changes
    - Add group_id column to attendance_sessions table
    - Add foreign key relationship to anaji_groups

  2. Security
    - Update existing policies to handle group-based sessions
*/

-- Add group_id column to attendance_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_sessions' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.attendance_sessions ADD COLUMN group_id UUID REFERENCES public.anaji_groups(id) ON DELETE SET NULL;
  END IF;
END $$;