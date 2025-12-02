-- Fix infinite recursion in workspace_members RLS policies
-- Drop existing policies for workspace_members
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspaces" ON public.workspace_members;

-- Drop existing policies for workspaces (in case they need to be recreated)
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;

-- Create a SECURITY DEFINER function to check membership (avoids recursion)
CREATE OR REPLACE FUNCTION public.check_workspace_membership(ws_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a SECURITY DEFINER function to check admin role
CREATE OR REPLACE FUNCTION public.check_workspace_admin(ws_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
    AND user_id = check_user_id
    AND role IN ('Owner', 'Admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate workspace policies (using functions to avoid recursion)
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT
  USING (public.check_workspace_membership(id));

CREATE POLICY "Workspace owners can update" ON public.workspaces
  FOR UPDATE
  USING (public.check_workspace_admin(id));

-- Allow authenticated users to create workspaces (no membership check needed for creation)
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Workspace members: Users can view members of their workspaces (using function to avoid recursion)
CREATE POLICY "Users can view workspace members" ON public.workspace_members
  FOR SELECT
  USING (public.check_workspace_membership(workspace_id));

-- Workspace members: Owners/Admins can manage members (using function to avoid recursion)
CREATE POLICY "Workspace admins can manage members" ON public.workspace_members
  FOR ALL
  USING (public.check_workspace_admin(workspace_id));

-- Workspace members: Users can join via invite (they can insert themselves)
CREATE POLICY "Users can join workspaces" ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- First, make username nullable (if it exists and is NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'workspaces' 
    AND column_name = 'username'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.workspaces ALTER COLUMN username DROP NOT NULL;
  END IF;
END $$;

-- Update existing workspaces to set username to NULL (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'workspaces' 
    AND column_name = 'username'
  ) THEN
    UPDATE public.workspaces SET username = NULL WHERE username IS NOT NULL;
  END IF;
END $$;

-- Remove username column from workspaces table
ALTER TABLE public.workspaces
DROP COLUMN IF EXISTS username;

