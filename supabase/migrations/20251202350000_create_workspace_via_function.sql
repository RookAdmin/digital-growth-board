-- Create a SECURITY DEFINER function to create workspaces
-- This bypasses RLS and allows authenticated users to create workspaces
CREATE OR REPLACE FUNCTION public.create_workspace(
  p_name TEXT,
  p_workspace_type TEXT,
  p_category TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate workspace_type
  IF p_workspace_type NOT IN ('Creator', 'Business') THEN
    RAISE EXCEPTION 'Invalid workspace_type. Must be Creator or Business';
  END IF;

  -- Insert workspace
  INSERT INTO public.workspaces (
    name,
    workspace_type,
    category,
    created_by
  )
  VALUES (
    p_name,
    p_workspace_type,
    p_category,
    v_user_id
  )
  RETURNING id INTO v_workspace_id;

  -- Add creator as Owner
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    role
  )
  VALUES (
    v_workspace_id,
    v_user_id,
    'Owner'
  )
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN v_workspace_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_workspace(TEXT, TEXT, TEXT) TO authenticated;

-- Also ensure the INSERT policy is still there as a backup
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;

CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

