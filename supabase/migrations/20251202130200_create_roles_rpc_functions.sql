-- RPC Functions for Roles CRUD operations

-- Get all roles (filtered by is_assignable if needed)
CREATE OR REPLACE FUNCTION public.get_roles(include_non_assignable BOOLEAN DEFAULT false)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  permissions JSONB,
  is_system_role BOOLEAN,
  is_assignable BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.permissions,
    r.is_system_role,
    r.is_assignable,
    r.created_at,
    r.updated_at
  FROM public.roles r
  WHERE (include_non_assignable = true OR r.is_assignable = true)
  ORDER BY r.is_system_role DESC, r.name ASC;
END;
$$;

-- Get single role by ID
CREATE OR REPLACE FUNCTION public.get_role(role_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  permissions JSONB,
  is_system_role BOOLEAN,
  is_assignable BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.permissions,
    r.is_system_role,
    r.is_assignable,
    r.created_at,
    r.updated_at
  FROM public.roles r
  WHERE r.id = role_id
  LIMIT 1;
END;
$$;

-- Create new role (Super Admin only)
CREATE OR REPLACE FUNCTION public.create_role(
  role_name TEXT,
  role_description TEXT,
  role_permissions JSONB,
  role_is_assignable BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_role_id UUID;
BEGIN
  -- Check if user is Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND role = 'Super Admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only Super Admins can create roles';
  END IF;

  -- Insert new role
  INSERT INTO public.roles (name, description, permissions, is_assignable)
  VALUES (role_name, role_description, role_permissions, role_is_assignable)
  RETURNING id INTO new_role_id;

  RETURN new_role_id;
END;
$$;

-- Update role (Super Admin only)
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

  -- Prevent updating system roles (except permissions)
  IF EXISTS (SELECT 1 FROM public.roles WHERE id = role_id AND is_system_role = true) THEN
    -- Only allow updating permissions and description for system roles
    UPDATE public.roles
    SET 
      description = role_description,
      permissions = role_permissions,
      updated_at = now()
    WHERE id = role_id;
  ELSE
    -- Allow full update for custom roles
    UPDATE public.roles
    SET 
      name = role_name,
      description = role_description,
      permissions = role_permissions,
      is_assignable = role_is_assignable,
      updated_at = now()
    WHERE id = role_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- Delete role (Super Admin only, cannot delete system roles)
CREATE OR REPLACE FUNCTION public.delete_role(role_id UUID)
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
    RAISE EXCEPTION 'Only Super Admins can delete roles';
  END IF;

  -- Prevent deleting system roles
  IF EXISTS (SELECT 1 FROM public.roles WHERE id = role_id AND is_system_role = true) THEN
    RAISE EXCEPTION 'Cannot delete system roles';
  END IF;

  -- Check if role is assigned to any team members
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE role = (SELECT name FROM public.roles WHERE id = role_id)
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot delete role that is assigned to active team members';
  END IF;

  -- Delete the role
  DELETE FROM public.roles WHERE id = role_id;

  RETURN FOUND;
END;
$$;

-- Get permissions schema (available pages/features)
CREATE OR REPLACE FUNCTION public.get_permissions_schema()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN '{
    "Core Pages": {
      "dashboard": "Dashboard",
      "clients": "Clients",
      "leads": "Leads",
      "projects": "Projects"
    },
    "Team Management": {
      "team": "Team Members",
      "roles": "Access Levels"
    },
    "Business Operations": {
      "billing": "Billing",
      "scheduling": "Scheduling",
      "files": "Files"
    },
    "Analytics": {
      "reporting": "Reporting",
      "analytics": "Analytics"
    },
    "Administration": {
      "partners": "Partners",
      "settings": "Settings"
    }
  }'::jsonb;
END;
$$;

