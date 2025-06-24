
-- Create a table to track lead status changes
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage status history
CREATE POLICY "Allow authenticated users to manage lead status history"
ON public.lead_status_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_at ON public.lead_status_history(changed_at);

-- Enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_status_history;
