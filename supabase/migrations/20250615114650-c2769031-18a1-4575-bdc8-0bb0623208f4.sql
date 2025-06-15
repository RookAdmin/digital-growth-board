
CREATE OR REPLACE FUNCTION public.create_client_user_from_client()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone,
      confirmation_token, recovery_token, email_change_token_new, email_change, reauthentication_token
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
$function$
