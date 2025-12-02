-- Update RPC functions to include color field

-- Drop and recreate get_roles function to change return type
DROP FUNCTION IF EXISTS public.get_roles(boolean);
DROP FUNCTION IF EXISTS public.get_roles();

-- Recreate get_roles function with color field
CREATE FUNCTION public.get_roles(include_non_assignable BOOLEAN DEFAULT false)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  permissions JSONB,
  is_system_role BOOLEAN,
  is_assignable BOOLEAN,
  color TEXT,
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
    COALESCE(r.color, '#6366f1') as color,
    r.created_at,
    r.updated_at
  FROM public.roles r
  WHERE (include_non_assignable = true OR r.is_assignable = true)
  ORDER BY 
    CASE WHEN r.name = 'Super Admin' THEN 0 ELSE 1 END,
    r.is_system_role DESC, 
    r.name ASC;
END;
$$;

-- Drop and recreate get_role function to change return type
DROP FUNCTION IF EXISTS public.get_role(uuid);

-- Recreate get_role function with color field
CREATE FUNCTION public.get_role(role_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  permissions JSONB,
  is_system_role BOOLEAN,
  is_assignable BOOLEAN,
  color TEXT,
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
    COALESCE(r.color, '#6366f1') as color,
    r.created_at,
    r.updated_at
  FROM public.roles r
  WHERE r.id = role_id
  LIMIT 1;
END;
$$;

-- Drop and recreate create_role function to include color parameter
-- Need to drop all possible signatures
DROP FUNCTION IF EXISTS public.create_role(text, text, jsonb, boolean);
DROP FUNCTION IF EXISTS public.create_role(text, text, jsonb, boolean, text);

-- Recreate create_role function with color parameter
CREATE FUNCTION public.create_role(
  role_name TEXT,
  role_description TEXT,
  role_permissions JSONB,
  role_is_assignable BOOLEAN DEFAULT true,
  role_color TEXT DEFAULT '#6366f1'
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

  -- Validate color format (6-character hex)
  IF role_color !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Color must be a valid 6-character hex code (e.g., #6366f1)';
  END IF;

  -- Insert new role
  INSERT INTO public.roles (name, description, permissions, is_assignable, color)
  VALUES (role_name, role_description, role_permissions, role_is_assignable, role_color)
  RETURNING id INTO new_role_id;

  RETURN new_role_id;
END;
$$;

-- Drop and recreate update_role function to include color parameter
-- Need to drop all possible signatures
DROP FUNCTION IF EXISTS public.update_role(uuid, text, text, jsonb, boolean);
DROP FUNCTION IF EXISTS public.update_role(uuid, text, text, jsonb, boolean, text);

-- Recreate update_role function with color parameter
CREATE FUNCTION public.update_role(
  role_id UUID,
  role_name TEXT,
  role_description TEXT,
  role_permissions JSONB,
  role_is_assignable BOOLEAN,
  role_color TEXT DEFAULT NULL
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

  -- Validate color format if provided
  IF role_color IS NOT NULL AND role_color !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Color must be a valid 6-character hex code (e.g., #6366f1)';
  END IF;

  -- Super Admin can update everything, including system roles
  -- The trigger will auto-update team_members.role when role name changes
  UPDATE public.roles
  SET 
    name = role_name,
    description = role_description,
    permissions = role_permissions,
    is_assignable = COALESCE(role_is_assignable, is_assignable),
    color = COALESCE(role_color, color),
    updated_at = now()
  WHERE id = role_id;

  RETURN FOUND;
END;
$$;

