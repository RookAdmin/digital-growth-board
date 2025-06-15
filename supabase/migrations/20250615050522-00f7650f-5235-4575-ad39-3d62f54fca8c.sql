
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Pending', 'Paid', 'Overdue', 'Cancelled')),
  due_date DATE NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoice_items table for line items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Stripe', 'Razorpay', 'Bank Transfer', 'Cash', 'Check')),
  payment_gateway_id TEXT, -- Stripe payment intent ID or Razorpay payment ID
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed', 'Refunded')),
  transaction_fee DECIMAL(10,2) DEFAULT 0,
  payment_date TIMESTAMPTZ,
  gateway_response JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view all invoices" ON public.invoices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create invoices" ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update invoices" ON public.invoices
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete invoices" ON public.invoices
FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for invoice_items
CREATE POLICY "Users can view all invoice items" ON public.invoice_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create invoice items" ON public.invoice_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update invoice items" ON public.invoice_items
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete invoice items" ON public.invoice_items
FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for payments
CREATE POLICY "Users can view all payments" ON public.payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create payments" ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update payments" ON public.payments
FOR UPDATE
TO authenticated
USING (true);

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Create triggers for updated_at
CREATE TRIGGER handle_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER handle_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  result_invoice_number TEXT;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(inv.invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices inv
  WHERE inv.invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-0001, INV-0002, etc.
  result_invoice_number := 'INV-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN result_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice total amount when items change (fixed GROUP BY issue)
CREATE OR REPLACE FUNCTION update_invoice_total_amount()
RETURNS TRIGGER AS $$
DECLARE
  items_total DECIMAL(10,2);
  current_tax DECIMAL(10,2);
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Get total of items
    SELECT COALESCE(SUM(total_price), 0) INTO items_total
    FROM public.invoice_items
    WHERE invoice_id = OLD.invoice_id;
    
    -- Get current tax amount
    SELECT tax_amount INTO current_tax
    FROM public.invoices
    WHERE id = OLD.invoice_id;
    
    -- Update invoice
    UPDATE public.invoices
    SET 
      amount = items_total,
      total_amount = items_total + COALESCE(current_tax, 0)
    WHERE id = OLD.invoice_id;
    
    RETURN OLD;
  ELSE
    -- Get total of items
    SELECT COALESCE(SUM(total_price), 0) INTO items_total
    FROM public.invoice_items
    WHERE invoice_id = NEW.invoice_id;
    
    -- Get current tax amount
    SELECT tax_amount INTO current_tax
    FROM public.invoices
    WHERE id = NEW.invoice_id;
    
    -- Update invoice
    UPDATE public.invoices
    SET 
      amount = items_total,
      total_amount = items_total + COALESCE(current_tax, 0)
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating invoice totals
CREATE TRIGGER update_invoice_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_total_amount();

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(10,2);
  total_paid DECIMAL(10,2);
BEGIN
  -- Get invoice total
  SELECT total_amount INTO invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Get total payments for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id AND status = 'Completed';
  
  -- Update invoice status based on payment
  IF total_paid >= invoice_total THEN
    UPDATE public.invoices
    SET status = 'Paid'
    WHERE id = NEW.invoice_id;
  ELSIF total_paid > 0 THEN
    UPDATE public.invoices
    SET status = 'Pending'
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating invoice status on payment
CREATE TRIGGER update_invoice_status_trigger
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
WHEN (NEW.status = 'Completed')
EXECUTE FUNCTION update_invoice_payment_status();

-- Insert sample invoices
INSERT INTO public.invoices (client_id, project_id, invoice_number, title, description, amount, tax_amount, total_amount, status, due_date, payment_terms, notes)
SELECT 
  c.id,
  p.id,
  generate_invoice_number(),
  'Project Invoice - ' || p.name,
  'Invoice for project milestones and deliverables',
  CASE 
    WHEN ROW_NUMBER() OVER() % 3 = 1 THEN 2500.00
    WHEN ROW_NUMBER() OVER() % 3 = 2 THEN 4800.00
    ELSE 1250.00
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() % 3 = 1 THEN 250.00
    WHEN ROW_NUMBER() OVER() % 3 = 2 THEN 480.00
    ELSE 125.00
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() % 3 = 1 THEN 2750.00
    WHEN ROW_NUMBER() OVER() % 3 = 2 THEN 5280.00
    ELSE 1375.00
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'Paid'
    WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'Pending'
    WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'Sent'
    ELSE 'Overdue'
  END,
  CURRENT_DATE + INTERVAL '30 days',
  'Net 30 days',
  'Thank you for your business!'
FROM public.clients c
LEFT JOIN public.projects p ON p.client_id = c.id
WHERE p.id IS NOT NULL
LIMIT 6;

-- Insert sample invoice items
INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total_price)
SELECT 
  i.id,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY i.id) = 1 THEN 'Initial Design & Planning'
    WHEN ROW_NUMBER() OVER(PARTITION BY i.id) = 2 THEN 'Development & Implementation'
    ELSE 'Testing & Deployment'
  END,
  1,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY i.id) = 1 THEN i.amount * 0.3
    WHEN ROW_NUMBER() OVER(PARTITION BY i.id) = 2 THEN i.amount * 0.5
    ELSE i.amount * 0.2
  END,
  CASE 
    WHEN ROW_NUMBER() OVER(PARTITION BY i.id) = 1 THEN i.amount * 0.3
    WHEN ROW_NUMBER() OVER(PARTITION BY i.id) = 2 THEN i.amount * 0.5
    ELSE i.amount * 0.2
  END
FROM public.invoices i
CROSS JOIN generate_series(1, 3) AS item_num;

-- Insert sample payments for paid invoices
INSERT INTO public.payments (invoice_id, payment_method, amount, status, payment_date, notes)
SELECT 
  i.id,
  CASE 
    WHEN ROW_NUMBER() OVER() % 2 = 1 THEN 'Stripe'
    ELSE 'Bank Transfer'
  END,
  i.total_amount,
  'Completed',
  CURRENT_DATE - INTERVAL '5 days',
  'Payment received successfully'
FROM public.invoices i
WHERE i.status = 'Paid';
