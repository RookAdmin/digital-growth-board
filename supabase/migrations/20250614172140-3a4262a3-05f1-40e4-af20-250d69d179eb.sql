
-- Create the 'leads' table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  services_interested TEXT[],
  budget_range TEXT,
  lead_source TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for the table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to manage all leads
CREATE POLICY "Allow authenticated users to manage leads"
ON public.leads
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function when a lead is updated
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time functionality for the 'leads' table
alter publication supabase_realtime add table public.leads;
