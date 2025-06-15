
-- Create task_comments table for feedback on specific tasks
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task comments
CREATE POLICY "Users can view all task comments" ON public.task_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create task comments" ON public.task_comments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own task comments" ON public.task_comments
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Users can delete their own task comments" ON public.task_comments
FOR DELETE
TO authenticated
USING (user_email = auth.jwt()->>'email');

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

-- Create trigger for updated_at
CREATE TRIGGER handle_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', true);

-- Create storage policy for project files - allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'project-files');

-- Allow users to delete files they uploaded
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project-files' AND owner = auth.uid());

-- Create project_files table to track file uploads with metadata
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_email TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project files
CREATE POLICY "Users can view all project files" ON public.project_files
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can upload project files" ON public.project_files
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete their own project files" ON public.project_files
FOR DELETE
TO authenticated
USING (uploaded_by_email = auth.jwt()->>'email');

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;

-- Insert sample comments for existing tasks
INSERT INTO public.task_comments (task_id, user_name, user_email, comment)
SELECT 
  t.id,
  'John Smith',
  'john.smith@example.com',
  CASE 
    WHEN t.type = 'milestone' THEN 'Great milestone completion! The deliverables look excellent.'
    WHEN t.status = 'Completed' THEN 'Task completed successfully. Good work on this one.'
    WHEN t.status = 'In Progress' THEN 'Making good progress on this task. Keep up the momentum.'
    ELSE 'Looking forward to seeing progress on this task.'
  END
FROM public.tasks t
WHERE random() < 0.3; -- Add comments to roughly 30% of tasks
