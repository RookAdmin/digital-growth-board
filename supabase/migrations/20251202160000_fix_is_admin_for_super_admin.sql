-- Fix is_admin() function to include Super Admin role
-- Currently it only checks for CEO and CTO, but Super Admin should also be considered an admin

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('CEO', 'CTO / Director of Technology', 'Super Admin')
    AND is_active = true
  );
END;
$$;

