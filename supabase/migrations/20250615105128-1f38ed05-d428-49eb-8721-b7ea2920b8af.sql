
-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Re-run the one-off script to create users for existing clients,
-- in case it failed previously due to the missing extension.
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
