-- Update existing roles to match the new role names
UPDATE public.team_members 
SET role = 'Client Executive' 
WHERE role = 'Project Manager';

UPDATE public.team_members 
SET role = 'Developers' 
WHERE role = 'Staff';

-- Drop the old constraint
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Add the new constraint
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('Admin', 'Client Executive', 'Developers'));