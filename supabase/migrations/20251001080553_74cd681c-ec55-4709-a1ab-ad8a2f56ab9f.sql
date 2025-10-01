-- Add group_id to attendance_sessions to support group-based attendance
ALTER TABLE public.attendance_sessions
ADD COLUMN group_id uuid REFERENCES public.anaji_groups(id) ON DELETE SET NULL;

-- Add image_url to anaji_members for profile images
ALTER TABLE public.anaji_members
ADD COLUMN image_url text;

-- Create index for better query performance
CREATE INDEX idx_attendance_sessions_group_id ON public.attendance_sessions(group_id);
CREATE INDEX idx_attendance_sessions_date ON public.attendance_sessions(date);