-- Extend proposals to be tracked against leads and store delivery assets
ALTER TABLE public.proposals
ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS word_doc_link TEXT,
ADD COLUMN IF NOT EXISTS proposal_pdf_url TEXT;

CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);

