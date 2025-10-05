/*
  # Add Occupation Field to Members Table

  ## Changes
    - Add `occupation` column to `anaji_members` table
    - Column type: text, nullable
    - Allows storing member occupation/profession information
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anaji_members' AND column_name = 'occupation'
  ) THEN
    ALTER TABLE public.anaji_members ADD COLUMN occupation TEXT;
  END IF;
END $$;
