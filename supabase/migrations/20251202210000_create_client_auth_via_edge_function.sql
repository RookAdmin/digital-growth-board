-- Create client auth users via Edge Function instead of direct database trigger
-- This avoids schema errors during authentication

-- Note: The Edge Function approach is preferred over database triggers
-- because it uses Supabase Admin API which properly handles auth user creation

-- Note: We're using application-level calls to the Edge Function instead of database triggers
-- This is safer and doesn't interfere with authentication queries
-- The Edge Function is called from the application code after client creation

-- However, a better approach is to call the Edge Function from application code
-- So we'll also create a simpler RPC function that can be called manually

CREATE OR REPLACE FUNCTION public.ensure_client_auth_user(client_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  result JSONB;
BEGIN
  -- Get client details
  SELECT * INTO client_record
  FROM public.clients
  WHERE id = client_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Client not found');
  END IF;
  
  -- Check if auth user already exists
  IF EXISTS (
    SELECT 1 FROM public.client_users
    WHERE client_id = client_id_param
  ) THEN
    RETURN jsonb_build_object('message', 'Auth user already exists for this client');
  END IF;
  
  -- Return instructions to call Edge Function
  -- The actual creation should be done via Edge Function from application code
  RETURN jsonb_build_object(
    'message', 'Please call the create-client-auth Edge Function',
    'client_id', client_id_param,
    'email', client_record.email
  );
END;
$$;

