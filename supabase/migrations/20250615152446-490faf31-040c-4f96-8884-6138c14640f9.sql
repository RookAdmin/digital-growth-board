
-- Allow lead_id in clients table to be nullable, which is required for ON DELETE SET NULL to work
ALTER TABLE public.clients ALTER COLUMN lead_id DROP NOT NULL;
