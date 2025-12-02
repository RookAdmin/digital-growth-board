-- Rebuild client auth system: Create auth users automatically via Edge Function
-- This ensures auth users are created when clients are created from lead conversion

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_client_created_call_auth_function ON public.clients;
DROP FUNCTION IF EXISTS public.create_client_auth_user_trigger();

-- Enable pg_net extension if available (for calling Edge Functions from database)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_net might not be available, that's okay - we'll use application-level calls
    RAISE NOTICE 'pg_net extension not available, will rely on application-level Edge Function calls';
END;
$$;

-- Create a function that can be called to ensure client auth user exists
-- This can be called from application code or as a backup
CREATE OR REPLACE FUNCTION public.ensure_client_auth_user(client_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  existing_auth_user_id UUID;
BEGIN
  -- Get client details
  SELECT * INTO client_record
  FROM public.clients
  WHERE id = client_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Client not found', 'client_id', client_id_param);
  END IF;
  
  -- Check if auth user already exists in client_users
  SELECT id INTO existing_auth_user_id
  FROM public.client_users
  WHERE client_id = client_id_param
  LIMIT 1;
  
  IF existing_auth_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'message', 'Auth user already exists for this client',
      'client_id', client_id_param,
      'auth_user_id', existing_auth_user_id
    );
  END IF;
  
  -- Return client info so application can call Edge Function
  RETURN jsonb_build_object(
    'message', 'Client found, please call create-client-auth Edge Function',
    'client_id', client_id_param,
    'email', client_record.email,
    'phone', COALESCE(client_record.phone, ''),
    'name', COALESCE(client_record.name, client_record.email)
  );
END;
$$;

-- Note: The actual auth user creation is handled by the Edge Function
-- which is called from application code (LeadsTable.tsx, KanbanCard.tsx)
-- The Edge Function uses Supabase Admin API to create auth users safely

