-- Create lead_statuses table for workspace-specific custom lead statuses
CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6366f1', -- Default color
  is_default BOOLEAN NOT NULL DEFAULT false, -- True for "New", "Converted", "Dropped"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- Create index for faster queries
CREATE INDEX idx_lead_statuses_workspace_id ON public.lead_statuses(workspace_id);
CREATE INDEX idx_lead_statuses_display_order ON public.lead_statuses(workspace_id, display_order);

-- Enable Row Level Security
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view lead statuses for their workspace
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

-- Policy: Users with manage_lead_statuses permission can insert/update/delete
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

-- Function to create default lead statuses for a workspace
-- Only creates the 3 required default statuses: New, Converted, Dropped
-- Other statuses must be created dynamically by each workspace
CREATE OR REPLACE FUNCTION public.create_default_lead_statuses(workspace_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Insert only the 3 required default statuses: New, Converted, Dropped
  INSERT INTO public.lead_statuses (workspace_id, name, display_order, color, is_default, is_active)
  VALUES
    (workspace_uuid, 'New', 0, '#9ca3af', true, true),
    (workspace_uuid, 'Converted', 1, '#10b981', true, true),
    (workspace_uuid, 'Dropped', 2, '#ef4444', true, true)
  ON CONFLICT (workspace_id, name) DO NOTHING;
  
  -- Note: Other statuses (Contacted, Qualified, Proposal Sent, Approvals, etc.)
  -- must be created dynamically by each workspace through the Settings page
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default lead statuses when a new workspace is created
CREATE OR REPLACE FUNCTION public.trigger_create_default_lead_statuses()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_lead_statuses(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new workspaces
DROP TRIGGER IF EXISTS create_default_lead_statuses_trigger ON public.workspaces;
CREATE TRIGGER create_default_lead_statuses_trigger
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.trigger_create_default_lead_statuses();

-- Backfill existing workspaces with default lead statuses
DO $$
DECLARE
  workspace_record RECORD;
BEGIN
  FOR workspace_record IN SELECT id FROM public.workspaces
  LOOP
    PERFORM public.create_default_lead_statuses(workspace_record.id);
  END LOOP;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lead_statuses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_lead_statuses_updated_at
BEFORE UPDATE ON public.lead_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_statuses_updated_at();

