-- Allow duplicate emails/phones for leads and capture related entities
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS unique_leads_email;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);

