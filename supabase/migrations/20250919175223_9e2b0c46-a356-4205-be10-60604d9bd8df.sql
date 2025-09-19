-- Update the team_members role check constraint to allow the new roles
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('Admin', 'Client Executive', 'Developers'));