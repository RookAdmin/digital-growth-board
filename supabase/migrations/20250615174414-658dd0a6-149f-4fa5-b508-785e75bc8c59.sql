
-- Enable Row-Level Security for the clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to avoid errors on re-run
DROP POLICY IF EXISTS "Allow admins to view all clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admins to create clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admins to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admins to delete clients" ON public.clients;

-- RLS Policies for clients table
-- 1. Allow admins to view all clients
CREATE POLICY "Allow admins to view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.is_admin());

-- 2. Allow admins to create clients
CREATE POLICY "Allow admins to create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 3. Allow admins to update clients
CREATE POLICY "Allow admins to update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 4. Allow admins to delete clients
CREATE POLICY "Allow admins to delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.is_admin());
