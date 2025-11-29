-- Update team_members role constraint to include Super Admin
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN (
  'Super Admin',
  'CEO', 
  'CTO / Director of Technology', 
  'SME (Subject Matter Expert)', 
  'Project Manager', 
  'Client Executive', 
  'Developer'
));

