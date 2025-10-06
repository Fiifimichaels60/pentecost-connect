-- Add gender column to anaji_members table
ALTER TABLE public.anaji_members 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));

-- Add comment to explain the column
COMMENT ON COLUMN public.anaji_members.gender IS 'Member gender: male, female, or other';