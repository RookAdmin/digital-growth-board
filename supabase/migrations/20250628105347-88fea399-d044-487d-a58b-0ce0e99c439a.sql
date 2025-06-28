
-- First, let's handle duplicate emails by keeping only the most recent entries
-- Remove duplicates from leads table, keeping the most recent one
DELETE FROM public.leads 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.leads 
    ORDER BY email, created_at DESC
);

-- Remove duplicates from clients table, keeping the most recent one
DELETE FROM public.clients 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.clients 
    ORDER BY email, created_at DESC
);

-- Remove duplicates from team_members table, keeping the most recent one
DELETE FROM public.team_members 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.team_members 
    ORDER BY email, created_at DESC
);

-- Remove duplicates from client_users table, keeping the most recent one
DELETE FROM public.client_users 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.client_users 
    ORDER BY email, created_at DESC
);

-- Now add the unique constraints
ALTER TABLE public.leads ADD CONSTRAINT unique_leads_email UNIQUE (email);
ALTER TABLE public.clients ADD CONSTRAINT unique_clients_email UNIQUE (email);
ALTER TABLE public.team_members ADD CONSTRAINT unique_team_members_email UNIQUE (email);
ALTER TABLE public.client_users ADD CONSTRAINT unique_client_users_email UNIQUE (email);

-- Add first_name and last_name columns to existing tables
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Create a function to check if email exists across multiple tables
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email exists in auth.users, leads, clients, team_members, or client_users
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
    UNION
    SELECT 1 FROM public.leads WHERE email = email_to_check
    UNION  
    SELECT 1 FROM public.clients WHERE email = email_to_check
    UNION
    SELECT 1 FROM public.team_members WHERE email = email_to_check
    UNION
    SELECT 1 FROM public.client_users WHERE email = email_to_check
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_email_exists TO authenticated, anon;
