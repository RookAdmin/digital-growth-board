
-- Create tasks table to store project tasks and milestones
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'milestone')),
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  assigned_team_members TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view all tasks" ON public.tasks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage tasks" ON public.tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Create trigger for updated_at
CREATE TRIGGER handle_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update completed_at when status changes to 'Completed'
CREATE OR REPLACE FUNCTION public.update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'Completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_task_completion
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_task_completed_at();

-- Insert sample tasks for existing projects
INSERT INTO public.tasks (project_id, title, description, type, status, priority, due_date, assigned_team_members)
SELECT 
  p.id,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 1 THEN 'Project Kickoff Meeting'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 2 THEN 'Requirements Gathering'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 3 THEN 'Design Phase'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 4 THEN 'Development Sprint 1'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 5 THEN 'Client Review'
    ELSE 'Project Delivery'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 1 THEN 'Initial meeting with client to discuss project scope and requirements'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 2 THEN 'Gather detailed requirements and create project specification'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 3 THEN 'Create wireframes and design mockups for client approval'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 4 THEN 'Begin development of core features and functionality'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 5 THEN 'Present initial version to client for feedback'
    ELSE 'Final delivery and project handover to client'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) IN (1, 5, 6) THEN 'milestone'
    ELSE 'task'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 1 THEN 'Completed'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 2 THEN 'In Progress'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 3 THEN 'Not Started'
    ELSE 'Not Started'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) IN (1, 6) THEN 'high'
    WHEN ROW_NUMBER() OVER(PARTITION BY p.id) = 5 THEN 'urgent'
    ELSE 'medium'
  END,
  p.deadline - INTERVAL '5 days' * (6 - ROW_NUMBER() OVER(PARTITION BY p.id)),
  p.assigned_team_members
FROM public.projects p
CROSS JOIN generate_series(1, 6) AS task_num;
