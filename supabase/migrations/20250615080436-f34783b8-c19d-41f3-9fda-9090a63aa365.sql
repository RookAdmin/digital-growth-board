
-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Project Manager', 'Staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_member_projects table for project assignments
CREATE TABLE public.team_member_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(team_member_id, project_id)
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_member_projects (fixed syntax)
ALTER TABLE public.team_member_projects ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'Admin' 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get current team member
CREATE OR REPLACE FUNCTION public.get_current_team_member()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Policies for team_members table
CREATE POLICY "Admins can view all team members" 
  ON public.team_members 
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Team members can view their own data" 
  ON public.team_members 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert team members" 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update team members" 
  ON public.team_members 
  FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admins can delete team members" 
  ON public.team_members 
  FOR DELETE 
  USING (public.is_admin());

-- Policies for team_member_projects table
CREATE POLICY "Admins can manage all project assignments" 
  ON public.team_member_projects 
  FOR ALL 
  USING (public.is_admin());

CREATE POLICY "Team members can view their assigned projects" 
  ON public.team_member_projects 
  FOR SELECT 
  USING (team_member_id = public.get_current_team_member());

-- Update projects table policies to include team member access
CREATE POLICY "Team members can view assigned projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.team_member_projects tmp
      WHERE tmp.project_id = projects.id 
      AND tmp.team_member_id = public.get_current_team_member()
    )
  );

-- Update other tables to allow team member access
CREATE POLICY "Team members can view tasks for assigned projects" 
  ON public.tasks 
  FOR ALL 
  USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.team_member_projects tmp
      WHERE tmp.project_id = tasks.project_id 
      AND tmp.team_member_id = public.get_current_team_member()
    )
  );

CREATE POLICY "Team members can view messages for assigned projects" 
  ON public.project_messages 
  FOR ALL 
  USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.team_member_projects tmp
      WHERE tmp.project_id = project_messages.project_id 
      AND tmp.team_member_id = public.get_current_team_member()
    )
  );

CREATE POLICY "Team members can view files for assigned projects" 
  ON public.project_files 
  FOR ALL 
  USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.team_member_projects tmp
      WHERE tmp.project_id = project_files.project_id 
      AND tmp.team_member_id = public.get_current_team_member()
    )
  );

CREATE POLICY "Team members can view activity logs for assigned projects" 
  ON public.activity_logs 
  FOR SELECT 
  USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.team_member_projects tmp
      WHERE tmp.project_id = activity_logs.project_id 
      AND tmp.team_member_id = public.get_current_team_member()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_members_updated_at();
