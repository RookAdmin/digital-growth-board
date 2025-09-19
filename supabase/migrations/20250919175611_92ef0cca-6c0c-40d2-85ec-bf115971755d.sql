-- Drop the existing constraint with old role values
ALTER TABLE public.team_members 
DROP CONSTRAINT team_members_role_check;

-- Add the new constraint with updated roles
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('Admin', 'Client Executive', 'Developers'));