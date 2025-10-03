-- Create junction table for many-to-many relationship between members and groups
CREATE TABLE IF NOT EXISTS public.anaji_member_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.anaji_members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.anaji_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, group_id)
);

-- Enable RLS on the junction table
ALTER TABLE public.anaji_member_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for junction table
CREATE POLICY "Anyone can view member groups"
  ON public.anaji_member_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage member groups"
  ON public.anaji_member_groups
  FOR ALL
  USING (true);

-- Create function to update member count in groups
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the member count for the affected group
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update member count
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON public.anaji_member_groups;
CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR DELETE ON public.anaji_member_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Migrate existing member-group relationships to the junction table
INSERT INTO public.anaji_member_groups (member_id, group_id)
SELECT id, group_id
FROM public.anaji_members
WHERE group_id IS NOT NULL
ON CONFLICT (member_id, group_id) DO NOTHING;

-- Update all group member counts based on current data
UPDATE public.anaji_groups g
SET member_count = (
  SELECT COUNT(DISTINCT mg.member_id)
  FROM public.anaji_member_groups mg
  WHERE mg.group_id = g.id
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_member_groups_member_id ON public.anaji_member_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_group_id ON public.anaji_member_groups(group_id);