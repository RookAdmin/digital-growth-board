-- Create function to auto-update team member roles when role name changes
CREATE OR REPLACE FUNCTION public.update_team_member_roles_on_role_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If role name changed, update all team members with the old role name
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE public.team_members
    SET role = NEW.name
    WHERE role = OLD.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update team member roles
DROP TRIGGER IF EXISTS on_role_name_change_update_team_members ON public.roles;
CREATE TRIGGER on_role_name_change_update_team_members
  AFTER UPDATE OF name ON public.roles
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION public.update_team_member_roles_on_role_name_change();

