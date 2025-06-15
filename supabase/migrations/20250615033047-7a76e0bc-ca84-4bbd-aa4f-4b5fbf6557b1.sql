
-- Create meeting_slots table to store available meeting times
CREATE TABLE IF NOT EXISTS public.meeting_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'cancelled')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  meeting_type TEXT DEFAULT 'kickoff',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create client_files table for file upload tracking
CREATE TABLE IF NOT EXISTS public.client_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_slots (corrected)
CREATE POLICY "Users can view available meeting slots" ON public.meeting_slots
FOR SELECT
TO authenticated
USING (status = 'available' OR client_id IS NULL);

CREATE POLICY "Admins can manage all meeting slots" ON public.meeting_slots
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Clients can book available slots" ON public.meeting_slots
FOR UPDATE
TO authenticated
USING (status = 'available')
WITH CHECK (status = 'booked');

-- RLS Policies for client_files
CREATE POLICY "Users can manage their client files" ON public.client_files
FOR ALL
TO authenticated
USING (uploaded_by = auth.uid() OR client_id IN (
  SELECT id FROM public.clients WHERE lead_id IN (
    SELECT id FROM public.leads
  )
))
WITH CHECK (uploaded_by = auth.uid() OR client_id IN (
  SELECT id FROM public.clients WHERE lead_id IN (
    SELECT id FROM public.leads
  )
));

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_files;

-- Create triggers for updated_at
CREATE TRIGGER handle_meeting_slots_updated_at
BEFORE UPDATE ON public.meeting_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a storage bucket for client files
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-files');

CREATE POLICY "Users can view their files" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-files');

CREATE POLICY "Users can delete their files" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-files');
