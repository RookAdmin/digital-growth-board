
-- Create projects table to store client projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Review', 'Completed')),
  deadline DATE,
  assigned_team_members TEXT[] DEFAULT '{}',
  budget DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view all projects" ON public.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage projects" ON public.projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Create trigger for updated_at
CREATE TRIGGER handle_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.projects (client_id, name, description, status, deadline, assigned_team_members, budget) 
SELECT 
  c.id,
  CASE 
    WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'Website Redesign'
    WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'SEO Optimization'
    WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'Social Media Campaign'
    ELSE 'Brand Identity Design'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'Complete website redesign with modern UI/UX'
    WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'Improve search engine rankings and organic traffic'
    WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'Develop comprehensive social media strategy'
    ELSE 'Create new brand identity and visual guidelines'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'In Progress'
    WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'Not Started'
    WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'Review'
    ELSE 'Completed'
  END,
  CURRENT_DATE + INTERVAL '30 days' * (ROW_NUMBER() OVER() % 3 + 1),
  ARRAY['John Doe', 'Jane Smith', 'Mike Johnson'],
  (ROW_NUMBER() OVER() % 3 + 1) * 5000.00
FROM public.clients c
LIMIT 10;
