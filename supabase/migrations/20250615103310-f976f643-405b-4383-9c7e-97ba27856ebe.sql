
-- Function to create a client user account in Supabase Auth when a new client is added
CREATE OR REPLACE FUNCTION public.create_client_user_from_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create a new user in Supabase Auth using the client's email and phone as password.
  -- This bypasses email confirmation.
  -- NOTE: This directly manipulates the auth.users table which is generally not recommended,
  -- but necessary here to automate user creation from a database trigger.
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone)
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
      NEW.phone
    ) RETURNING id INTO new_user_id;

    -- Link this new auth user to the client record in public.client_users
    INSERT INTO public.client_users (id, client_id, email)
    VALUES (new_user_id, NEW.id, NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to call the function after a new client is inserted into the public.clients table
DROP TRIGGER IF EXISTS on_client_created_create_auth_user ON public.clients;
CREATE TRIGGER on_client_created_create_auth_user
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_user_from_client();

-- One-off script to create user accounts for existing clients who don't have one
DO $$
DECLARE
    client_record RECORD;
    new_user_id UUID;
BEGIN
    FOR client_record IN 
      SELECT * FROM public.clients c
      WHERE NOT EXISTS (SELECT 1 FROM public.client_users cu WHERE cu.client_id = c.id)
      AND c.phone IS NOT NULL AND c.phone <> ''
    LOOP
        -- Check if an auth user with this email already exists
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = client_record.email) THEN
          -- Create a new user in Supabase Auth
          INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone)
          VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            client_record.email,
            crypt(client_record.phone, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            client_record.phone
          ) RETURNING id INTO new_user_id;

          -- Insert into client_users table
          INSERT INTO public.client_users (id, client_id, email)
          VALUES (new_user_id, client_record.id, client_record.email);
        END IF;
    END LOOP;
END;
$$;
