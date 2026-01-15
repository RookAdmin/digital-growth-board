-- Fix the RLS policy for lead_statuses to use correct JSON operators
-- The issue: using ->> twice doesn't work because ->> returns text, not jsonb
-- Fix: use -> for nested JSON access, then ->> for final text extraction

DROP POLICY IF EXISTS "Users can manage lead statuses with permission" ON public.lead_statuses;

CREATE POLICY "Users can manage lead statuses with permission"
ON public.lead_statuses
FOR ALL
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
      OR (r.permissions->'manage_lead_statuses'->>'write')::boolean = true
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.roles r ON r.name = tm.role
    WHERE tm.user_id = auth.uid()
    AND tm.workspace_id = lead_statuses.workspace_id
    AND tm.is_active = true
    AND (
      r.name = 'Super Admin'
      OR (r.permissions->'manage_lead_statuses'->>'write')::boolean = true
    )
  )
);

