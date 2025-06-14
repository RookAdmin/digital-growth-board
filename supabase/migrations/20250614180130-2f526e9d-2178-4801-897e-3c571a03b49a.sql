
-- Add new columns to the clients table for more details from the lead
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS services_interested TEXT[],
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'Not Started';

-- Create a table to store client onboarding data
CREATE TABLE IF NOT EXISTS public.client_onboarding_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  company_name TEXT,
  social_media_links JSONB,
  business_goals TEXT,
  brand_assets_url TEXT,
  target_audience TEXT,
  competitor_info TEXT,
  progress INT NOT NULL DEFAULT 0, -- Progress as a percentage
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security for the new table
ALTER TABLE public.client_onboarding_data ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to manage their onboarding data
-- Note: This is a generic policy. For a client portal, you'd restrict access to the specific client.
CREATE POLICY "Allow authenticated users to manage onboarding data" ON public.client_onboarding_data
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add the new table to the Supabase realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'client_onboarding_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_onboarding_data;
  END IF;
END $$;

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER handle_onboarding_data_updated_at
BEFORE UPDATE ON public.client_onboarding_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
