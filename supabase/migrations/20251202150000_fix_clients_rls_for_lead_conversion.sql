-- Fix RLS policies to allow team members to create clients when converting leads
-- The current policy only allows admins (CEO/CTO) to create clients, but other roles
-- like Client Executive, Project Manager should also be able to convert leads

-- Drop the restrictive admin-only policy for creating clients
DROP POLICY IF EXISTS "Allow admins to create clients" ON public.clients;

-- Create a new policy that allows any authenticated team member to create clients
-- This is needed for lead conversion functionality
CREATE POLICY "Allow team members to create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Also ensure team members can view clients (not just admins)
-- Keep the admin policy but add a team member policy
-- Note: We keep both policies so admins still work, and team members also work
CREATE POLICY "Allow team members to view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.client_users
    WHERE id = auth.uid()
    AND client_id = clients.id
  )
);

