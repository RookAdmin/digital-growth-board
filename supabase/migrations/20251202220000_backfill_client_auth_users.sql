-- Backfill auth users for existing clients that don't have auth users
-- This creates auth users for clients that were created before the Edge Function was set up

-- Create a function to backfill auth users for a specific client
CREATE OR REPLACE FUNCTION public.backfill_client_auth_user(client_id_param UUID)
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
  
  -- Check if auth user exists in auth.users by email
  SELECT id INTO existing_auth_user_id
  FROM auth.users
  WHERE email = client_record.email
  LIMIT 1;
  
  IF existing_auth_user_id IS NOT NULL THEN
    -- Link existing auth user to client_users
    INSERT INTO public.client_users (id, client_id, email, password_changed)
    VALUES (existing_auth_user_id, client_id_param, client_record.email, FALSE)
    ON CONFLICT (id) DO UPDATE
    SET client_id = client_id_param, email = client_record.email;
    
    RETURN jsonb_build_object(
      'message', 'Linked existing auth user to client',
      'client_id', client_id_param,
      'auth_user_id', existing_auth_user_id
    );
  END IF;
  
  -- No auth user exists - return instructions to create via Edge Function
  RETURN jsonb_build_object(
    'message', 'No auth user found. Please call create-client-auth Edge Function',
    'client_id', client_id_param,
    'email', client_record.email,
    'action_required', 'Call Edge Function: create-client-auth'
  );
END;
$$;

-- Create a function to backfill all clients without auth users
CREATE OR REPLACE FUNCTION public.backfill_all_client_auth_users()
RETURNS TABLE (
  client_id UUID,
  email TEXT,
  status TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  result JSONB;
BEGIN
  -- Loop through all clients that don't have auth users
  FOR client_record IN
    SELECT c.*
    FROM public.clients c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.client_users cu WHERE cu.client_id = c.id
    )
  LOOP
    result := public.backfill_client_auth_user(client_record.id);
    
    client_id := client_record.id;
    email := client_record.email;
    status := CASE 
      WHEN result->>'error' IS NOT NULL THEN 'error'
      WHEN result->>'action_required' IS NOT NULL THEN 'action_required'
      ELSE 'success'
    END;
    message := result->>'message';
    
    RETURN NEXT;
  END LOOP;
END;
$$;

