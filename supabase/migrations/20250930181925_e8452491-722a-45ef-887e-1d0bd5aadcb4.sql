-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_client_created_auth ON public.clients;
DROP FUNCTION IF EXISTS public.create_client_auth_user();

-- Create a proper function that handles NULL values correctly
CREATE OR REPLACE FUNCTION public.create_client_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  auth_user_id UUID;
  default_password TEXT := 'client123';
BEGIN
  -- Check if a user with this email already exists in auth.users
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = NEW.email 
  LIMIT 1;

  -- If no user found, create one with default password
  IF auth_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      email_change_confirm_status,
      recovery_token,
      reauthentication_token,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      confirmed_at,
      is_sso_user
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      NEW.email,
      crypt(default_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      NULL,
      '',
      '',
      0,
      '',
      '',
      NULL,
      NULL,
      '',
      '',
      now(),
      false
    ) RETURNING id INTO auth_user_id;
  END IF;

  -- Link the auth user to client_users table
  IF auth_user_id IS NOT NULL THEN
    INSERT INTO public.client_users (id, client_id, email)
    VALUES (auth_user_id, NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to run when a new client is created
CREATE TRIGGER on_client_created_auth
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_auth_user();