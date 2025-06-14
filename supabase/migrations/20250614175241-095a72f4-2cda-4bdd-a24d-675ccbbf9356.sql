
-- Create the 'proposals' table to store proposal details (corrected)
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- e.g., Draft, Sent, Approved, Rejected
  terms TEXT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  signature_url TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the 'proposal_items' table for line items in each proposal
CREATE TABLE public.proposal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the 'lead_notes' table to store notes for leads
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a function to update the total_amount in the proposals table
CREATE OR REPLACE FUNCTION public.update_proposal_total_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.proposals
    SET total_amount = (
      SELECT COALESCE(SUM(quantity * unit_price), 0)
      FROM public.proposal_items
      WHERE proposal_id = OLD.proposal_id
    )
    WHERE id = OLD.proposal_id;
    RETURN OLD;
  ELSE
    UPDATE public.proposals
    SET total_amount = (
      SELECT COALESCE(SUM(quantity * unit_price), 0)
      FROM public.proposal_items
      WHERE proposal_id = NEW.proposal_id
    )
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on proposal_items to call the function
CREATE TRIGGER update_proposal_total_after_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.proposal_items
FOR EACH ROW
EXECUTE FUNCTION public.update_proposal_total_amount();

-- Enable Row Level Security (RLS) for the new tables
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Allow authenticated users to manage proposals" ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage proposal items" ON public.proposal_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage lead notes" ON public.lead_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create a storage bucket for signed proposals
INSERT INTO storage.buckets (id, name, public) VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the proposals bucket
CREATE POLICY "Allow authenticated users to manage proposal files" ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'proposals')
WITH CHECK (bucket_id = 'proposals');

-- Add the new tables to the Supabase realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals, public.proposal_items, public.lead_notes;

