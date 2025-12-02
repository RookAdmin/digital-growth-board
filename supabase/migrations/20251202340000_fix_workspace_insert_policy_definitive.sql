-- Fix workspace creation RLS policy definitively
-- Drop ALL existing workspace policies and recreate them in correct order

-- Drop all workspace policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;

-- Recreate policies in correct order (INSERT first, then SELECT, then UPDATE)
-- 1. INSERT policy - Allow any authenticated user to create workspaces
-- This must be permissive (WITH CHECK (true)) because user isn't a member yet
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. SELECT policy - Allow users to view workspaces they are members of
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    public.check_workspace_membership(id)
  );

-- 3. UPDATE policy - Allow workspace owners/admins to update their workspaces
CREATE POLICY "Workspace owners can update" ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    public.check_workspace_admin(id)
  )
  WITH CHECK (
    public.check_workspace_admin(id)
  );

-- Ensure workspace_members INSERT policy allows users to add themselves
DROP POLICY IF EXISTS "Users can join workspaces" ON public.workspace_members;

CREATE POLICY "Users can join workspaces" ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

