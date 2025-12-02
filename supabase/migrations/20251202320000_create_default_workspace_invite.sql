-- Create an invite code for the default "Realm by Rook" workspace
-- This allows users to join the default workspace using a 10-character alphanumeric code

INSERT INTO public.workspace_invites (
  workspace_id,
  invite_code,
  created_by,
  is_active,
  max_uses,
  uses_count
)
SELECT 
  '0ba9db55-491b-4f44-a76c-fdbf7073cb38',
  public.generate_invite_code(),
  NULL, -- System created
  true,
  NULL, -- Unlimited uses
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_invites 
  WHERE workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38'
  AND is_active = true
);

-- Display the invite code (for reference, you can query this)
-- SELECT invite_code FROM public.workspace_invites 
-- WHERE workspace_id = '0ba9db55-491b-4f44-a76c-fdbf7073cb38' 
-- AND is_active = true 
-- LIMIT 1;

