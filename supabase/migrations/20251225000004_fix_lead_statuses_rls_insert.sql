-- Fix RLS policy for lead_statuses to properly handle INSERT operations
-- The issue: WITH CHECK clause needs to check the NEW row's workspace_id, not the existing row's

DROP POLICY IF EXISTS "Users can manage lead statuses with permission" ON public.lead_statuses;

-- Separate policies for better control
-- SELECT policy: Users can view lead statuses for their workspace
DROP POLICY IF EXISTS "Users can view lead statuses for their workspace" ON public.lead_statuses;

CREATE POLICY "Users can view lead statuses for their workspace"
ON public.lead_statuses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
  )
);

-- INSERT policy: Users with permission can insert new statuses
-- For INSERT, lead_statuses.workspace_id refers to the NEW row's workspace_id
CREATE POLICY "Users can insert lead statuses with permission"
ON public.lead_statuses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    LEFT JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id  -- NEW row's workspace_id
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
CREATE POLICY "Users can delete lead statuses with permission"
ON public.lead_statuses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
    AND (
      r.name = 'Super Admin'
      OR (r.permissions->'manage_lead_statuses'->>'delete')::boolean = true
      OR (r.permissions->'manage_lead_statuses'->>'admin')::boolean = true
    )
  )
  AND is_default = false  -- Cannot delete default statuses
);

