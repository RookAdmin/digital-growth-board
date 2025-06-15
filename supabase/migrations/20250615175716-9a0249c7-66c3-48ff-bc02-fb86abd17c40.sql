
-- Make user an Admin to allow deleting clients
-- This will insert a new team member record if one doesn't exist for the email,
-- or update the existing record to have the 'Admin' role.
INSERT INTO public.team_members (user_id, name, email, role, is_active)
VALUES ('7116e66e-0579-4bb1-a854-e2e957e8b229', 'Karthik', 'karthik@realmrook.com', 'Admin', true)
ON CONFLICT (email) DO UPDATE 
SET role = 'Admin', is_active = true, updated_at = now();
