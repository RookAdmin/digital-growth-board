-- Final fix for lead_statuses RLS policies
-- This ensures all policies work correctly for multiple workspaces

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert lead_statuses with permission" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can update lead_statuses with permission" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can view lead_statuses for their workspace" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can delete lead_statuses with permission" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can manage lead statuses with permission" ON public.lead_statuses;

-- SELECT policy: Most permissive - users can view if they have any association with the workspace
CREATE POLICY "Users can view lead_statuses for their workspace"
ON public.lead_statuses
FOR SELECT
TO authenticated
USING (
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
  OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = lead_statuses.workspace_id
    AND w.created_by = auth.uid()
  )
);

-- INSERT policy: Workspace owners/admins OR team members with permission
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
  -- Workspace creators can insert
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = lead_statuses.workspace_id
    AND w.created_by = auth.uid()
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
      tm.role = 'Super Admin'
      OR (r.id IS NOT NULL AND (
        COALESCE((r.permissions->'manage_lead_statuses'->>'write')::boolean, false) = true
        OR COALESCE((r.permissions->'manage_lead_statuses'->>'admin')::boolean, false) = true
      ))
    )
  )
);

-- UPDATE policy: Same as INSERT
CREATE POLICY "Users can update lead_statuses with permission"
ON public.lead_statuses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
    AND wm.role IN ('Owner', 'Admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = lead_statuses.workspace_id
    AND w.created_by = auth.uid()
  )
  OR EXISTS (
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
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = lead_statuses.workspace_id
    AND wm.role IN ('Owner', 'Admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = lead_statuses.workspace_id
    AND w.created_by = auth.uid()
  )
  OR EXISTS (
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

-- DELETE policy: Same but also check is_default = false
CREATE POLICY "Users can delete lead_statuses with permission"
ON public.lead_statuses
FOR DELETE
TO authenticated
USING (
  lead_statuses.is_default = false
  AND (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.workspace_id = lead_statuses.workspace_id
      AND wm.role IN ('Owner', 'Admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = lead_statuses.workspace_id
      AND w.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      LEFT JOIN public.roles r ON r.name = tm.role
      WHERE tm.user_id = auth.uid()
      AND tm.workspace_id = lead_statuses.workspace_id
      AND tm.is_active = true
      AND (
        tm.role = 'Super Admin'
        OR (r.id IS NOT NULL AND (
          COALESCE((r.permissions->'manage_lead_statuses'->>'delete')::boolean, false) = true
          OR COALESCE((r.permissions->'manage_lead_statuses'->>'admin')::boolean, false) = true
        ))
      )
    )
  )
);

