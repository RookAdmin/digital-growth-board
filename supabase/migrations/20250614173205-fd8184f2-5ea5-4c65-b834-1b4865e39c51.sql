
-- Create the 'clients' table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  lead_id UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for the table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to view all clients
CREATE POLICY "Allow authenticated users to view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- Create a policy to allow authenticated users to create clients
CREATE POLICY "Allow authenticated users to create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add the new clients table to the Supabase realtime publication
alter publication supabase_realtime add table public.clients;

