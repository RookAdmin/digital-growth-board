-- Create project_agreements table for storing project agreements and documents
CREATE TABLE IF NOT EXISTS public.project_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('project_onboard', 'project_proposal', 'service_agreement', 'dynamic_document')),
  text_content TEXT,
  pdf_url TEXT,
  word_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique constraint only for non-dynamic documents (one per project per type)
CREATE UNIQUE INDEX IF NOT EXISTS project_agreements_unique_non_dynamic 
ON public.project_agreements (project_id, document_type) 
WHERE document_type != 'dynamic_document';

-- Enable Row Level Security
ALTER TABLE public.project_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project agreements
CREATE POLICY "Users can view all project agreements" ON public.project_agreements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create project agreements" ON public.project_agreements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update project agreements" ON public.project_agreements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete project agreements" ON public.project_agreements
FOR DELETE
TO authenticated
USING (true);

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_agreements;

-- Create trigger for updated_at
CREATE TRIGGER handle_project_agreements_updated_at
BEFORE UPDATE ON public.project_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project agreements if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-agreements', 'project-agreements', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for project agreements - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload project agreements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-agreements');

-- Create storage policy for project agreements - allow authenticated users to read
CREATE POLICY "Authenticated users can read project agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-agreements');

-- Create storage policy for project agreements - allow authenticated users to update
CREATE POLICY "Authenticated users can update project agreements"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-agreements');

-- Create storage policy for project agreements - allow authenticated users to delete
CREATE POLICY "Authenticated users can delete project agreements"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-agreements');

