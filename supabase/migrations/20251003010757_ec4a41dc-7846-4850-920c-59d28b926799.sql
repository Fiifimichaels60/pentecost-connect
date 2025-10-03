-- Fix the function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;