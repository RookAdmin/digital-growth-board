-- First, update existing team members to use new role values
UPDATE public.team_members 
SET role = 'Admin' 
WHERE role = 'admin';

UPDATE public.team_members 
SET role = 'Client Executive' 
WHERE role IN ('Project Manager', 'project_manager', 'client_executive');

UPDATE public.team_members 
SET role = 'Developers' 
WHERE role IN ('Staff', 'staff', 'developer', 'developers');

-- Drop the old constraint if it exists
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Add the new constraint with the correct roles
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('Admin', 'Client Executive', 'Developers'));