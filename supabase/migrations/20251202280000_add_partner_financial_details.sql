-- Add bank and tax details to partners table

-- Bank Details
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_routing_number TEXT, -- For US/Canada
ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT, -- For India
ADD COLUMN IF NOT EXISTS bank_swift_code TEXT, -- International
ADD COLUMN IF NOT EXISTS bank_branch_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT;

-- Tax Details (country-specific)
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS tax_id_type TEXT, -- GST, VAT, EIN, ABN, etc.
ADD COLUMN IF NOT EXISTS tax_id_number TEXT, -- The actual tax ID
ADD COLUMN IF NOT EXISTS vat_number TEXT, -- For EU/UK
ADD COLUMN IF NOT EXISTS ein_number TEXT, -- For US
ADD COLUMN IF NOT EXISTS abn_number TEXT, -- For Australia
ADD COLUMN IF NOT EXISTS hst_number TEXT, -- For Canada
ADD COLUMN IF NOT EXISTS business_number TEXT; -- Generic business registration number

-- Add comments
COMMENT ON COLUMN public.partners.tax_id_type IS 'Tax ID type based on country: GST (India), VAT (EU/UK), EIN (US), ABN (Australia), HST (Canada), etc.';
COMMENT ON COLUMN public.partners.tax_id_number IS 'Primary tax identification number based on tax_id_type';



