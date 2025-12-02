-- Fix workspace creation RLS policy
-- Drop and recreate the policy to ensure it works correctly

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;

-- Allow any authenticated user to create workspaces
-- The created_by field will be set by the application
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Also ensure workspace_members INSERT policy allows users to add themselves as Owner
-- This is needed when creating a workspace
DROP POLICY IF EXISTS "Users can join workspaces" ON public.workspace_members;

CREATE POLICY "Users can join workspaces" ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

