-- Add new columns to partners table for detailed information
ALTER TABLE partners 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN gst_no TEXT,
ADD COLUMN registration_type TEXT,
ADD COLUMN address TEXT,
ADD COLUMN website TEXT,
ADD COLUMN position TEXT,
ADD COLUMN office_phone_no TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT;

-- Add comment for registration_type options
COMMENT ON COLUMN partners.registration_type IS 'Registration type: Sole Proprietorship, Partnership, LLC, Corporation, etc.';