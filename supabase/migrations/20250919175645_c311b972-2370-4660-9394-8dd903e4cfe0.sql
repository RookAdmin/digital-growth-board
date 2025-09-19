-- Drop the existing constraint
ALTER TABLE public.team_members 
DROP CONSTRAINT team_members_role_check;

-- Update all existing data to use new role names
UPDATE public.team_members 
SET role = 'Client Executive' 
WHERE role = 'Project Manager';

UPDATE public.team_members 
SET role = 'Developers' 
WHERE role = 'Staff';

-- Now add the new constraint
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('Admin', 'Client Executive', 'Developers'));