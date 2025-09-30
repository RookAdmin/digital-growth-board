-- Fix the create_client_auth_user function to not set confirmed_at manually
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
      recovery_token,
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
      '',
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