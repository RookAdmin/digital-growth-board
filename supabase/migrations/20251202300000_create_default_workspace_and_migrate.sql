-- Create default workspace "Realm by Rook"
INSERT INTO public.workspaces (id, name, workspace_type, category, created_at)
VALUES (
  '0ba9db55-491b-4f44-a76c-fdbf7073cb38',
  'Realm by Rook',
  'Business',
  'Agency',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Migrate all existing team_members to default workspace
UPDATE public.team_members
SET workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
WHERE workspace_id IS NULL;

-- Migrate all existing partners to default workspace
UPDATE public.partners
SET workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
WHERE workspace_id IS NULL;

-- Migrate all existing clients to default workspace
UPDATE public.clients
SET workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
WHERE workspace_id IS NULL;

-- Migrate all existing projects to default workspace
UPDATE public.projects
SET workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
WHERE workspace_id IS NULL;

-- Migrate all existing leads to default workspace
UPDATE public.leads
SET workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
WHERE workspace_id IS NULL;

-- Add all existing team members as workspace members
INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
SELECT 
  '0ba9db55-491b-4f44-a76c-fdbf7073cb38',
  user_id,
  CASE 
    WHEN role = 'Admin' THEN 'Owner'
    ELSE 'Member'
  END,
  COALESCE(joined_at, created_at)
FROM public.team_members
WHERE user_id NOT IN (
  SELECT user_id FROM public.workspace_members
  WHERE workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Add all existing partners as workspace members
INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
SELECT 
  '0ba9db55-491b-4f44-a76c-fdbf7073cb38',
  user_id,
  'Member',
  created_at
FROM public.partners
WHERE user_id NOT IN (
  SELECT user_id FROM public.workspace_members
  WHERE workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Make workspace_id NOT NULL after migration
ALTER TABLE public.team_members
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.partners
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.clients
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.projects
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.leads
ALTER COLUMN workspace_id SET NOT NULL;

