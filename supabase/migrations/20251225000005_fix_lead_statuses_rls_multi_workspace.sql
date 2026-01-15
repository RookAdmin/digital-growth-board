-- Fix RLS policy for lead_statuses to work with multiple workspaces
-- The issue: Users might be in workspace_members but not team_members for new workspaces
-- Solution: Check both workspace_members and team_members tables

-- Drop all existing policies for lead_statuses to start fresh
DROP POLICY IF EXISTS "Users can insert lead_statuses with permission" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can update lead_statuses with permission" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can view lead_statuses for their workspace" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can delete lead_statuses with permission" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can manage lead statuses with permission" ON public.lead_statuses;

-- SELECT policy: Users can view lead statuses for workspaces they belong to
CREATE POLICY "Users can view lead statuses for their workspace"
ON public.lead_statuses
FOR SELECT
TO authenticated
USING (
  -- Check if user is in workspace_members OR team_members for this workspace
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
  )
);

-- INSERT policy: Users with permission can insert new statuses
-- Check both workspace_members (for workspace owners/admins) and team_members (for role-based permissions)
CREATE POLICY "Users can insert lead_statuses with permission"
ON public.lead_statuses
FOR INSERT
TO authenticated
WITH CHECK (
  -- Workspace owners/admins can always insert
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
    AND wm.role IN ('Owner', 'Admin')
  )
  OR
  -- Team members with appropriate role/permissions can insert
  EXISTS (
    SELECT 1 FROM public.team_members tm
    LEFT JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
    AND (
      -- Super Admin always has access
      tm.role = 'Super Admin'
      -- Or check permissions if role exists
      OR (r.id IS NOT NULL AND (
        COALESCE((r.permissions->'manage_lead_statuses'->>'write')::boolean, false) = true
        OR COALESCE((r.permissions->'manage_lead_statuses'->>'admin')::boolean, false) = true
      ))
    )
  )
);

-- UPDATE policy: Users with permission can update statuses
CREATE POLICY "Users can update lead_statuses with permission"
ON public.lead_statuses
FOR UPDATE
TO authenticated
USING (
  -- Workspace owners/admins can always update
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
    AND wm.role IN ('Owner', 'Admin')
  )
  OR
  -- Team members with appropriate role/permissions can update
  EXISTS (
    SELECT 1 FROM public.team_members tm
    LEFT JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
    AND (
      tm.role = 'Super Admin'
      OR (r.id IS NOT NULL AND (
        COALESCE((r.permissions->'manage_lead_statuses'->>'write')::boolean, false) = true
        OR COALESCE((r.permissions->'manage_lead_statuses'->>'admin')::boolean, false) = true
      ))
    )
  )
)
WITH CHECK (
  -- Same check for WITH CHECK clause
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
    AND wm.role IN ('Owner', 'Admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    LEFT JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
    AND (
      tm.role = 'Super Admin'
      OR (r.id IS NOT NULL AND (
        COALESCE((r.permissions->'manage_lead_statuses'->>'write')::boolean, false) = true
        OR COALESCE((r.permissions->'manage_lead_statuses'->>'admin')::boolean, false) = true
      ))
    )
  )
);

-- DELETE policy: Users with permission can delete (soft delete by setting is_active = false)
CREATE POLICY "Users can delete lead_statuses with permission"
ON public.lead_statuses
FOR DELETE
TO authenticated
USING (
  -- Workspace owners/admins can always delete (except defaults)
  (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.workspace_id = lead_statuses.workspace_id
      AND wm.role IN ('Owner', 'Admin')
    )
    AND lead_statuses.is_default = false
  )
  OR
  -- Team members with appropriate role/permissions can delete
  EXISTS (
    SELECT 1 FROM public.team_members tm
    LEFT JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
    AND lead_statuses.is_default = false
    AND (
      tm.role = 'Super Admin'
      OR (r.id IS NOT NULL AND (
        COALESCE((r.permissions->'manage_lead_statuses'->>'delete')::boolean, false) = true
        OR COALESCE((r.permissions->'manage_lead_statuses'->>'admin')::boolean, false) = true
      ))
    )
  )
);

