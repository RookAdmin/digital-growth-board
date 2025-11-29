-- Add Super Admin role with full permissions
-- First, create the Super Admin role if it doesn't exist
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'Super Admin',
  'Full system access with all permissions enabled',
  '{
    "dashboard": {"read": true, "write": true, "delete": true, "admin": true},
    "clients": {"read": true, "write": true, "delete": true, "admin": true},
    "leads": {"read": true, "write": true, "delete": true, "admin": true},
    "projects": {"read": true, "write": true, "delete": true, "admin": true},
    "team": {"read": true, "write": true, "delete": true, "admin": true},
    "billing": {"read": true, "write": true, "delete": true, "admin": true},
    "scheduling": {"read": true, "write": true, "delete": true, "admin": true},
    "files": {"read": true, "write": true, "delete": true, "admin": true},
    "reporting": {"read": true, "write": true, "delete": true, "admin": true},
    "partners": {"read": true, "write": true, "delete": true, "admin": true},
    "analytics": {"read": true, "write": true, "delete": true, "admin": true},
    "settings": {"read": true, "write": true, "delete": true, "admin": true},
    "roles": {"read": true, "write": true, "delete": true, "admin": true}
  }'::jsonb,
  true,
  false
)
ON CONFLICT (name) DO NOTHING;

-- Create default permissions for existing roles
-- CEO - Full access except roles management (only Super Admin can manage roles)
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'CEO',
  'Chief Executive Officer with full business access',
  '{
    "dashboard": {"read": true, "write": true, "delete": false, "admin": true},
    "clients": {"read": true, "write": true, "delete": true, "admin": true},
    "leads": {"read": true, "write": true, "delete": true, "admin": true},
    "projects": {"read": true, "write": true, "delete": true, "admin": true},
    "team": {"read": true, "write": true, "delete": false, "admin": false},
    "billing": {"read": true, "write": true, "delete": true, "admin": true},
    "scheduling": {"read": true, "write": true, "delete": true, "admin": true},
    "files": {"read": true, "write": true, "delete": true, "admin": true},
    "reporting": {"read": true, "write": true, "delete": false, "admin": true},
    "partners": {"read": true, "write": true, "delete": true, "admin": true},
    "analytics": {"read": true, "write": true, "delete": false, "admin": true},
    "settings": {"read": true, "write": true, "delete": false, "admin": false},
    "roles": {"read": false, "write": false, "delete": false, "admin": false}
  }'::jsonb,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- CTO / Director of Technology
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'CTO / Director of Technology',
  'Technology leadership with technical and team management access',
  '{
    "dashboard": {"read": true, "write": true, "delete": false, "admin": true},
    "clients": {"read": true, "write": true, "delete": false, "admin": false},
    "leads": {"read": true, "write": true, "delete": false, "admin": false},
    "projects": {"read": true, "write": true, "delete": true, "admin": true},
    "team": {"read": true, "write": true, "delete": false, "admin": false},
    "billing": {"read": true, "write": false, "delete": false, "admin": false},
    "scheduling": {"read": true, "write": true, "delete": false, "admin": false},
    "files": {"read": true, "write": true, "delete": true, "admin": true},
    "reporting": {"read": true, "write": true, "delete": false, "admin": true},
    "partners": {"read": true, "write": true, "delete": false, "admin": false},
    "analytics": {"read": true, "write": true, "delete": false, "admin": true},
    "settings": {"read": true, "write": true, "delete": false, "admin": false},
    "roles": {"read": false, "write": false, "delete": false, "admin": false}
  }'::jsonb,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Project Manager
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'Project Manager',
  'Project management with client and project access',
  '{
    "dashboard": {"read": true, "write": false, "delete": false, "admin": false},
    "clients": {"read": true, "write": true, "delete": false, "admin": false},
    "leads": {"read": true, "write": true, "delete": false, "admin": false},
    "projects": {"read": true, "write": true, "delete": false, "admin": true},
    "team": {"read": true, "write": false, "delete": false, "admin": false},
    "billing": {"read": true, "write": true, "delete": false, "admin": false},
    "scheduling": {"read": true, "write": true, "delete": false, "admin": false},
    "files": {"read": true, "write": true, "delete": false, "admin": false},
    "reporting": {"read": true, "write": false, "delete": false, "admin": false},
    "partners": {"read": false, "write": false, "delete": false, "admin": false},
    "analytics": {"read": true, "write": false, "delete": false, "admin": false},
    "settings": {"read": false, "write": false, "delete": false, "admin": false},
    "roles": {"read": false, "write": false, "delete": false, "admin": false}
  }'::jsonb,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Client Executive
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'Client Executive',
  'Client relationship management with client and lead access',
  '{
    "dashboard": {"read": true, "write": false, "delete": false, "admin": false},
    "clients": {"read": true, "write": true, "delete": false, "admin": false},
    "leads": {"read": true, "write": true, "delete": false, "admin": true},
    "projects": {"read": true, "write": true, "delete": false, "admin": false},
    "team": {"read": false, "write": false, "delete": false, "admin": false},
    "billing": {"read": true, "write": true, "delete": false, "admin": false},
    "scheduling": {"read": true, "write": true, "delete": false, "admin": false},
    "files": {"read": true, "write": false, "delete": false, "admin": false},
    "reporting": {"read": false, "write": false, "delete": false, "admin": false},
    "partners": {"read": false, "write": false, "delete": false, "admin": false},
    "analytics": {"read": false, "write": false, "delete": false, "admin": false},
    "settings": {"read": false, "write": false, "delete": false, "admin": false},
    "roles": {"read": false, "write": false, "delete": false, "admin": false}
  }'::jsonb,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Developer
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'Developer',
  'Development team member with project access',
  '{
    "dashboard": {"read": false, "write": false, "delete": false, "admin": false},
    "clients": {"read": false, "write": false, "delete": false, "admin": false},
    "leads": {"read": false, "write": false, "delete": false, "admin": false},
    "projects": {"read": true, "write": true, "delete": false, "admin": false},
    "team": {"read": false, "write": false, "delete": false, "admin": false},
    "billing": {"read": false, "write": false, "delete": false, "admin": false},
    "scheduling": {"read": false, "write": false, "delete": false, "admin": false},
    "files": {"read": true, "write": true, "delete": false, "admin": false},
    "reporting": {"read": false, "write": false, "delete": false, "admin": false},
    "partners": {"read": false, "write": false, "delete": false, "admin": false},
    "analytics": {"read": false, "write": false, "delete": false, "admin": false},
    "settings": {"read": false, "write": false, "delete": false, "admin": false},
    "roles": {"read": false, "write": false, "delete": false, "admin": false}
  }'::jsonb,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- SME (Subject Matter Expert)
INSERT INTO public.roles (name, description, permissions, is_system_role, is_assignable)
VALUES (
  'SME (Subject Matter Expert)',
  'Subject matter expert with specialized project access',
  '{
    "dashboard": {"read": false, "write": false, "delete": false, "admin": false},
    "clients": {"read": true, "write": false, "delete": false, "admin": false},
    "leads": {"read": false, "write": false, "delete": false, "admin": false},
    "projects": {"read": true, "write": true, "delete": false, "admin": false},
    "team": {"read": false, "write": false, "delete": false, "admin": false},
    "billing": {"read": false, "write": false, "delete": false, "admin": false},
    "scheduling": {"read": false, "write": false, "delete": false, "admin": false},
    "files": {"read": true, "write": true, "delete": false, "admin": false},
    "reporting": {"read": false, "write": false, "delete": false, "admin": false},
    "partners": {"read": false, "write": false, "delete": false, "admin": false},
    "analytics": {"read": false, "write": false, "delete": false, "admin": false},
    "settings": {"read": false, "write": false, "delete": false, "admin": false},
    "roles": {"read": false, "write": false, "delete": false, "admin": false}
  }'::jsonb,
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

