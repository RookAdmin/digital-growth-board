
-- Create client_users table for client authentication
CREATE TABLE public.client_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_users
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- Create policy for client users to view their own data
CREATE POLICY "Client users can view their own data" 
  ON public.client_users 
  FOR SELECT 
  USING (id = auth.uid()::uuid);

-- Create policy for client users to update their own data
CREATE POLICY "Client users can update their own data" 
  ON public.client_users 
  FOR UPDATE 
  USING (id = auth.uid()::uuid);

-- Create client_sessions table for session management
CREATE TABLE public.client_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_user_id UUID REFERENCES public.client_users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_sessions
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for client sessions
CREATE POLICY "Client users can view their own sessions" 
  ON public.client_sessions 
  FOR ALL 
  USING (client_user_id = auth.uid()::uuid);

-- Add RLS policies for existing tables to allow client access
-- Clients can view their own data
CREATE POLICY "Clients can view their own client record" 
  ON public.clients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users 
      WHERE client_users.client_id = clients.id 
      AND client_users.id = auth.uid()::uuid
    )
  );

-- Clients can view their own projects
CREATE POLICY "Clients can view their own projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users 
      WHERE client_users.client_id = projects.client_id 
      AND client_users.id = auth.uid()::uuid
    )
  );

-- Clients can view their own onboarding data
CREATE POLICY "Clients can view their own onboarding data" 
  ON public.client_onboarding_data 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users 
      WHERE client_users.client_id = client_onboarding_data.client_id 
      AND client_users.id = auth.uid()::uuid
    )
  );

-- Clients can view their own invoices
CREATE POLICY "Clients can view their own invoices" 
  ON public.invoices 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users 
      WHERE client_users.client_id = invoices.client_id 
      AND client_users.id = auth.uid()::uuid
    )
  );

-- Clients can view their own files
CREATE POLICY "Clients can view their own files" 
  ON public.client_files 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users 
      WHERE client_users.client_id = client_files.client_id 
      AND client_users.id = auth.uid()::uuid
    )
  );

-- Clients can view project messages for their projects
CREATE POLICY "Clients can view their project messages" 
  ON public.project_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.client_users cu ON cu.client_id = p.client_id
      WHERE p.id = project_messages.project_id 
      AND cu.id = auth.uid()::uuid
    )
  );

-- Clients can send messages to their own projects
CREATE POLICY "Clients can send messages to their projects" 
  ON public.project_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.client_users cu ON cu.client_id = p.client_id
      WHERE p.id = project_messages.project_id 
      AND cu.id = auth.uid()::uuid
    )
  );
