-- Create login_audit table for tracking authentication attempts
CREATE TABLE IF NOT EXISTS public.login_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login_success', 'login_failed', 'logout', 'password_reset_request', 'password_reset_success')),
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON public.login_audit(email);
CREATE INDEX IF NOT EXISTS idx_login_audit_user_id ON public.login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON public.login_audit(created_at DESC);

-- Enable RLS
ALTER TABLE public.login_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.login_audit
  FOR SELECT
  USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.login_audit
  FOR INSERT
  WITH CHECK (true);

-- Create account_lockout table to track failed login attempts
CREATE TABLE IF NOT EXISTS public.account_lockout (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_failed_attempt TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_lockout ENABLE ROW LEVEL SECURITY;

-- Only admins can view lockout data
CREATE POLICY "Admins can view lockout data"
  ON public.account_lockout
  FOR SELECT
  USING (is_admin());

-- System can manage lockout data
CREATE POLICY "System can manage lockout data"
  ON public.account_lockout
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record
  FROM public.account_lockout
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if currently locked
  IF lockout_record.locked_until IS NOT NULL AND lockout_record.locked_until > now() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_attempts INTEGER := 5;
  lockout_duration INTERVAL := '30 minutes';
  current_attempts INTEGER;
BEGIN
  -- Insert or update account_lockout record
  INSERT INTO public.account_lockout (email, failed_attempts, last_failed_attempt, updated_at)
  VALUES (user_email, 1, now(), now())
  ON CONFLICT (email) 
  DO UPDATE SET 
    failed_attempts = account_lockout.failed_attempts + 1,
    last_failed_attempt = now(),
    updated_at = now();
  
  -- Get current attempts
  SELECT failed_attempts INTO current_attempts
  FROM public.account_lockout
  WHERE email = user_email;
  
  -- Lock account if max attempts reached
  IF current_attempts >= max_attempts THEN
    UPDATE public.account_lockout
    SET locked_until = now() + lockout_duration
    WHERE email = user_email;
  END IF;
END;
$$;

-- Function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_failed_login(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.account_lockout
  WHERE email = user_email;
END;
$$;