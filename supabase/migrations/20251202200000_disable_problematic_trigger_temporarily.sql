-- Disable the problematic trigger that causes schema errors during authentication
-- Auth users will now be created via Edge Function (create-client-auth) from application code
-- This prevents "Database error querying schema" errors during login

-- Drop the old trigger if it exists (this also disables it)
DROP TRIGGER IF EXISTS on_client_created_auth ON public.clients;

-- If the trigger still exists for some reason, disable it
-- Note: DISABLE TRIGGER doesn't support IF EXISTS, so we check first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_client_created_auth' 
    AND tgrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.clients DISABLE TRIGGER on_client_created_auth;
  END IF;
END $$;

