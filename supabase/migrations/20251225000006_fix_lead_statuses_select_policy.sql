-- Fix SELECT policy for lead_statuses to be more permissive
-- Ensure users can view lead statuses for any workspace they have access to

DROP POLICY IF EXISTS "Users can view lead_statuses for their workspace" ON public.lead_statuses;

-- More permissive SELECT policy
-- Users can view lead statuses if they are in workspace_members OR team_members
-- OR if they are the workspace creator
CREATE POLICY "Users can view lead_statuses for their workspace"
ON public.lead_statuses
FOR SELECT
TO authenticated
USING (
  -- Check if user is in workspace_members for this workspace
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
  )
  OR
  -- Check if user is in team_members for this workspace
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
  )
  OR
  -- Check if user is the workspace creator
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = lead_statuses.workspace_id
    AND w.created_by = auth.uid()
  )
);

