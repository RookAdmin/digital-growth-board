-- Add optional PDF URL storage for invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pdf_url text;

