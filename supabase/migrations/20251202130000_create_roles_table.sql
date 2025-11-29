-- Create roles table with permissions JSON field
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_assignable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Create index on is_assignable for filtering
CREATE INDEX IF NOT EXISTS idx_roles_is_assignable ON public.roles(is_assignable);

-- RLS Policies for roles table
-- Super Admins can do everything
CREATE POLICY "Super Admins can manage all roles"
  ON public.roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND role = 'Super Admin'
      AND is_active = true
    )
  );

-- All authenticated team members can view roles
CREATE POLICY "Team members can view roles"
  ON public.roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Function to check if user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
    AND role = 'Super Admin'
    AND is_active = true
  );
END;
$$;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role_name TEXT;
  role_permissions JSONB;
BEGIN
  -- Get user's role
  SELECT role INTO user_role_name
  FROM public.team_members
  WHERE user_id = auth.uid()
  AND is_active = true
  LIMIT 1;

  IF user_role_name IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Get permissions for the role
  SELECT permissions INTO role_permissions
  FROM public.roles
  WHERE name = user_role_name
  LIMIT 1;

  RETURN COALESCE(role_permissions, '{}'::jsonb);
END;
$$;

