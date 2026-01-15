-- Add manage_lead_statuses permission to permissions schema
CREATE OR REPLACE FUNCTION public.get_permissions_schema()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN '{
    "Core Pages": {
      "dashboard": "Dashboard",
      "clients": "Clients",
      "leads": "Leads",
      "projects": "Projects"
    },
    "Team Management": {
      "team": "Team Members",
      "roles": "Access Levels"
    },
    "Business Operations": {
      "billing": "Billing",
      "scheduling": "Scheduling",
      "files": "Files"
    },
    "Analytics": {
      "reporting": "Reporting",
      "analytics": "Analytics"
    },
    "Administration": {
      "partners": "Partners",
      "settings": "Settings",
      "manage_lead_statuses": "Manage Lead Statuses"
    }
  }'::jsonb;
END;
$$;

-- Add manage_lead_statuses permission to Super Admin
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{manage_lead_statuses}',
  '{"read": true, "write": true, "delete": true, "admin": true}'::jsonb
)
WHERE name = 'Super Admin';

-- Add manage_lead_statuses permission to CEO
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{manage_lead_statuses}',
  '{"read": true, "write": true, "delete": false, "admin": false}'::jsonb
)
WHERE name = 'CEO';

-- Add manage_lead_statuses permission to CTO / Director of Technology
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{manage_lead_statuses}',
  '{"read": true, "write": true, "delete": false, "admin": false}'::jsonb
)
WHERE name = 'CTO / Director of Technology';

-- Add manage_lead_statuses permission to Client Executive
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{manage_lead_statuses}',
  '{"read": true, "write": true, "delete": false, "admin": false}'::jsonb
)
WHERE name = 'Client Executive';

-- Add manage_lead_statuses permission to Project Manager
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{manage_lead_statuses}',
  '{"read": true, "write": true, "delete": false, "admin": false}'::jsonb
)
WHERE name = 'Project Manager';

-- Add manage_lead_statuses permission to SME (Subject Matter Expert)
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{manage_lead_statuses}',
  '{"read": true, "write": false, "delete": false, "admin": false}'::jsonb
)
WHERE name = 'SME (Subject Matter Expert)';

-- Developer and other roles don't get this permission by default

