-- First, let me see what role values currently exist after our updates
-- No constraint changes, just update data to ensure consistency

-- Update any remaining old role values
UPDATE public.team_members 
SET role = CASE 
  WHEN role = 'Project Manager' THEN 'Client Executive'
  WHEN role = 'Staff' THEN 'Developers'
  WHEN role = 'admin' THEN 'Admin'
  ELSE role
END
WHERE role NOT IN ('Admin', 'Client Executive', 'Developers');