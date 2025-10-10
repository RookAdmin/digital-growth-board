-- Add the first admin user to team_members table
INSERT INTO public.team_members (
  user_id,
  email,
  name,
  first_name,
  last_name,
  role,
  is_active,
  password_changed
) VALUES (
  'c676c8c8-323d-460d-a7ed-b8d07097f6cb',
  'karthik@realmrook.com',
  'Karthik Kishore B',
  'Karthik Kishore',
  'B',
  'Admin',
  true,
  true
);