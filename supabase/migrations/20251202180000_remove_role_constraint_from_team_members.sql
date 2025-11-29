-- Remove the hardcoded role constraint from team_members table
-- Since we now have a dynamic roles table, we should allow any role that exists in the roles table
-- We'll use a foreign key or trigger to validate instead, or just remove the constraint

-- Drop the existing constraint
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Note: We're removing the CHECK constraint because:
-- 1. Roles are now managed dynamically in the roles table
-- 2. Super Admin can create new roles that should be assignable
-- 3. The constraint would need to be updated every time a new role is created
-- 4. We can validate role assignment at the application level or via a trigger if needed

-- Optional: If you want to ensure only roles from the roles table can be assigned,
-- you could add a trigger, but for now we'll rely on application-level validation

