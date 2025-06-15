
-- Update the function to create client users to set default values for token fields
CREATE OR REPLACE FUNCTION public.create_client_user_from_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone,
      confirmation_token, recovery_token, email_change_token_new, email_change_token_current, reauthentication_token
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
      '', '', '', '', ''
    ) RETURNING id INTO new_user_id;

    -- Link this new auth user to the client record in public.client_users
    INSERT INTO public.client_users (id, client_id, email)
    VALUES (new_user_id, NEW.id, NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the one-off script to use the new INSERT statement format
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
          INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone,
            confirmation_token, recovery_token, email_change_token_new, email_change_token_current, reauthentication_token
          )
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
            client_record.phone,
            '', '', '', '', ''
          ) RETURNING id INTO new_user_id;

          -- Insert into client_users table
          INSERT INTO public.client_users (id, client_id, email)
          VALUES (new_user_id, client_record.id, client_record.email);
        END IF;
    END LOOP;
END;
$$;

-- One-off script to fix existing client users that have NULL token fields
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  id IN (SELECT id FROM public.client_users)
  AND (
    confirmation_token IS NULL OR
    recovery_token IS NULL OR
    email_change_token_new IS NULL OR
    email_change_token_current IS NULL OR
    reauthentication_token IS NULL
  );
