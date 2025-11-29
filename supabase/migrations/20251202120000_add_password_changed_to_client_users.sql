-- Add password_changed field to client_users table to track if client has changed their password
ALTER TABLE public.client_users 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Update existing client_users to have password_changed = false (they need to change password)
UPDATE public.client_users 
SET password_changed = FALSE 
WHERE password_changed IS NULL;

