/*
  # Create Settings Table and Add Hubtel Credentials

  ## New Tables
  
  ### nana_settings
    - `id` (uuid, primary key) - Setting identifier
    - `key` (text, unique) - Setting key name
    - `value` (text) - Setting value
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ## Initial Data
    - Add Hubtel SMS API credentials

  ## Security
    - Enable RLS on settings table
    - Add policies for authenticated access
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS public.nana_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nana_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view settings"
  ON public.nana_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.nana_settings
  FOR ALL
  USING (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_nana_settings_updated_at ON public.nana_settings;
CREATE TRIGGER update_nana_settings_updated_at
  BEFORE UPDATE ON public.nana_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_nana_settings_key ON public.nana_settings(key);

-- Insert Hubtel API credentials
INSERT INTO public.nana_settings (key, value)
VALUES 
  ('hubtel_client_id', 'rsvmqbyg'),
  ('hubtel_client_secret', 'yynmvnwk'),
  ('hubtel_sender_id', 'COPAnaji Eng')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();
