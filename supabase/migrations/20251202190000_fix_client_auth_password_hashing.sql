-- Fix client auth user creation
-- The issue is that accessing auth.instances during authentication can cause schema errors
-- We'll use a safer approach that doesn't query auth.instances

CREATE OR REPLACE FUNCTION public.create_client_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  auth_user_id UUID;
  default_password TEXT := 'Welcome@Rook';
BEGIN
  -- Check if a user with this email already exists in auth.users
  -- Use a safer query that won't interfere with authentication
  BEGIN
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = NEW.email 
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't query auth.users, skip auth user creation
      -- This prevents schema errors during authentication
      RAISE WARNING 'Cannot query auth.users for client %: %', NEW.email, SQLERRM;
      RETURN NEW;
  END;

  -- If no user found, create one with default password "Welcome@Rook"
  IF auth_user_id IS NULL THEN
    BEGIN
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
        phone,
        is_sso_user
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        NEW.email,
        crypt(default_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('email', NEW.email, 'phone', COALESCE(NEW.phone, '')),
        now(),
        now(),
        '',
        '',
        COALESCE(NEW.phone, ''),
        false
      ) RETURNING id INTO auth_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- If auth user creation fails, log but don't fail client creation
        RAISE WARNING 'Failed to create auth user for client %: %', NEW.email, SQLERRM;
        RETURN NEW;
    END;
  END IF;

  -- Link the auth user to client_users table
  IF auth_user_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.client_users (id, client_id, email, password_changed)
      VALUES (auth_user_id, NEW.id, NEW.email, FALSE)
      ON CONFLICT (id) DO UPDATE
      SET client_id = NEW.id, email = NEW.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to link auth user to client_users for client %: %', NEW.email, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Final catch-all: log the error but don't fail the client creation
    RAISE WARNING 'Error in create_client_auth_user for client %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$function$;

