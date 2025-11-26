-- Link project milestones (tasks) with invoices
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_invoice_id ON public.tasks(invoice_id);

