
-- Create project_messages table for internal messaging
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project messages
CREATE POLICY "Users can view all project messages" ON public.project_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create project messages" ON public.project_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own messages" ON public.project_messages
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Users can delete their own messages" ON public.project_messages
FOR DELETE
TO authenticated
USING (user_email = auth.jwt()->>'email');

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Create trigger for updated_at
CREATE TRIGGER handle_project_messages_updated_at
BEFORE UPDATE ON public.project_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create activity_logs table for tracking project activities
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('task_created', 'task_updated', 'task_completed', 'file_uploaded', 'file_deleted', 'message_sent', 'project_updated', 'comment_added')),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity logs
CREATE POLICY "Users can view all activity logs" ON public.activity_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create activity logs" ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Insert sample messages for existing projects
INSERT INTO public.project_messages (project_id, user_name, user_email, message, message_type)
SELECT 
  p.id,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 3 = 1 THEN 'Sarah Johnson'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 3 = 2 THEN 'Mike Chen'
    ELSE 'Alex Rodriguez'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 3 = 1 THEN 'sarah.johnson@example.com'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 3 = 2 THEN 'mike.chen@example.com'
    ELSE 'alex.rodriguez@example.com'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 4 = 1 THEN 'Hi team! I''ve reviewed the latest designs and they look great. Ready to move to the next phase.'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 4 = 2 THEN 'Just uploaded the revised mockups based on your feedback. Please take a look when you have a chance.'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 4 = 3 THEN 'Can we schedule a quick call tomorrow to discuss the project timeline?'
    ELSE 'Thanks for the update! The progress looks excellent so far.'
  END,
  'text'
FROM public.projects p
CROSS JOIN generate_series(1, 3) AS msg_num;

-- Insert sample activity logs for existing projects
INSERT INTO public.activity_logs (project_id, activity_type, user_name, user_email, description, metadata)
SELECT 
  p.id,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 1 THEN 'project_updated'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 2 THEN 'task_created'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 3 THEN 'file_uploaded'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 4 THEN 'task_completed'
    ELSE 'message_sent'
  END,
  'System User',
  'system@example.com',
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 1 THEN 'Project status updated to ' || p.status
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 2 THEN 'New task created: Project Kickoff Meeting'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 3 THEN 'File uploaded: project_brief.pdf'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) % 5 = 4 THEN 'Task completed: Requirements Gathering'
    ELSE 'New message posted in project chat'
  END,
  jsonb_build_object('project_name', p.name, 'project_status', p.status)
FROM public.projects p
CROSS JOIN generate_series(1, 4) AS activity_num;
