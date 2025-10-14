-- Allow unauthenticated users to insert leads (for public registration form)
CREATE POLICY "Allow public to submit registration forms"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure authenticated users can still manage leads
-- (the existing "Allow authenticated users to manage leads" policy already handles this)