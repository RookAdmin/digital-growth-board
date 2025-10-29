-- Add 'Approvals' status to leads if not already present
-- First, check current status values and update any existing enum if needed

-- Create a function to check if user is a developer
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

-- Create a function to get current user's role
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