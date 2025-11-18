-- Update roles system from 3 to 6 roles
-- First remove the old constraint, then update roles, then add new constraint

-- Drop the existing role check constraint if it exists
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Create new role check functions
CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'CEO' 
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_cto()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'CTO / Director of Technology' 
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_sme()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'SME (Subject Matter Expert)' 
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_project_manager()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'Project Manager' 
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_client_executive()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'Client Executive' 
    AND is_active = true
  );
END;
$$;

-- Update is_developer to use exact role name
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'Developer' 
    AND is_active = true
  );
END;
$$;

-- Update is_admin to check for CEO or CTO (full access roles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('CEO', 'CTO / Director of Technology')
    AND is_active = true
  );
END;
$$;

-- Keep existing helper functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_team_member()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT id FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
    LIMIT 1
  );
END;
$$;

-- Update existing team members with old roles to new roles
-- Map 'Admin' to 'CEO'
UPDATE public.team_members 
SET role = 'CEO' 
WHERE role = 'Admin';

-- Map 'Developers' (with typo) to 'Developer'
UPDATE public.team_members 
SET role = 'Developer' 
WHERE role = 'Developers';

-- Add new constraint with all 6 roles
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('CEO', 'CTO / Director of Technology', 'SME (Subject Matter Expert)', 'Project Manager', 'Client Executive', 'Developer'));