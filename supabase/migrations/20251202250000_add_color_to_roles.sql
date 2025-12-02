-- Add color field to roles table for Discord-style color circles
ALTER TABLE public.roles
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';

-- Create index on color for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_color ON public.roles(color);

-- Update existing roles with default colors
UPDATE public.roles
SET color = CASE 
  WHEN name = 'Super Admin' THEN '#ef4444'
  WHEN name = 'CEO' THEN '#3b82f6'
  WHEN name = 'CTO / Director of Technology' THEN '#8b5cf6'
  WHEN name = 'Client Executive' THEN '#10b981'
  WHEN name = 'Project Manager' THEN '#f59e0b'
  WHEN name = 'Developer' THEN '#06b6d4'
  WHEN name = 'SME' THEN '#ec4899'
  ELSE '#6366f1'
END
WHERE color IS NULL OR color = '#6366f1';

