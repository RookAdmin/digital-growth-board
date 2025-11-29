-- Allow Super Admin to edit and delete all roles (including system roles)
-- Remove restrictions based on is_system_role for Super Admin

-- Update the update_role function to allow Super Admin to edit all roles
CREATE OR REPLACE FUNCTION public.update_role(
  role_id UUID,
  role_name TEXT,
  role_description TEXT,
  role_permissions JSONB,
  role_is_assignable BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND role = 'Super Admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only Super Admins can update roles';
  END IF;

  -- Super Admin can edit all roles (including system roles)
  UPDATE public.roles
  SET 
    name = role_name,
    description = role_description,
    permissions = role_permissions,
    is_assignable = role_is_assignable,
    updated_at = now()
  WHERE id = role_id;

  RETURN FOUND;
END;
$$;

-- Update the delete_role function to allow Super Admin to delete any role
CREATE OR REPLACE FUNCTION public.delete_role(role_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_name_to_delete TEXT;
BEGIN
  -- Check if user is Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND role = 'Super Admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only Super Admins can delete roles';
  END IF;

  -- Get the role name before deleting
  SELECT name INTO role_name_to_delete
  FROM public.roles
  WHERE id = role_id;

  -- Check if role is assigned to any team members
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE role = role_name_to_delete
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot delete role that is assigned to active team members';
  END IF;

  -- Super Admin can delete any role (including system roles)
  DELETE FROM public.roles WHERE id = role_id;

  RETURN FOUND;
END;
$$;

