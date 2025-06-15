
-- This function is updated to handle cases where a user with the client's email
-- already exists in the auth.users table (e.g., as a team member).
-- It now checks for an existing user before attempting to create a new one,
-- preventing "duplicate key" errors.
CREATE OR REPLACE FUNCTION public.create_client_user_from_client()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Check if a user with this email already exists in auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = NEW.email LIMIT 1;

  -- If no user is found, create a new one
  IF auth_user_id IS NULL THEN
    IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, reauthentication_token, email_change
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        NEW.email,
        crypt(NEW.phone, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        NEW.phone,
        '', '', '', '', '', ''
      ) RETURNING id INTO auth_user_id;
    END IF;
  END IF;

  -- If we have a user ID (either from finding an existing user or creating a new one),
  -- link it to the new client record in public.client_users.
  IF auth_user_id IS NOT NULL THEN
    -- This will fail with a unique constraint violation if the user is already linked
    -- to a different client, which is the desired behavior to prevent data integrity issues.
    INSERT INTO public.client_users (id, client_id, email)
    VALUES (auth_user_id, NEW.id, NEW.email);
  END IF;
  
  RETURN NEW;
END;
$function$
