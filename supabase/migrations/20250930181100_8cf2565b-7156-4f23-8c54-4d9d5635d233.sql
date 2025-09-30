-- Drop all triggers and the function that manually inserts into auth.users
DROP TRIGGER IF EXISTS create_client_user_trigger ON public.clients CASCADE;
DROP TRIGGER IF EXISTS on_client_created ON public.clients CASCADE;
DROP TRIGGER IF EXISTS on_client_created_create_auth_user ON public.clients CASCADE;
DROP FUNCTION IF EXISTS public.create_client_user_from_client() CASCADE;

-- The client_users table should be populated through proper Supabase Auth signup flow
-- Not through manual insertions into auth.users table