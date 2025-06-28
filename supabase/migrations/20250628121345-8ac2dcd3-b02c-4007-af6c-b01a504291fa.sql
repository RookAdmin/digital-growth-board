
-- Add a default_password column to team_members table for initial password setup
ALTER TABLE public.team_members 
ADD COLUMN default_password TEXT;

-- Add a password_changed column to track if user has updated their password
ALTER TABLE public.team_members 
ADD COLUMN password_changed BOOLEAN DEFAULT FALSE;
