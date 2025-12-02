-- Create lead_users table for lead authentication
-- Similar to client_users, this links auth users to leads

CREATE TABLE IF NOT EXISTS public.lead_users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_changed BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_users_lead_id ON public.lead_users(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_users_email ON public.lead_users(email);

-- Enable RLS
ALTER TABLE public.lead_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Lead users can view their own data"
  ON public.lead_users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Team members can view all lead users"
  ON public.lead_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Service role can manage lead users"
  ON public.lead_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

