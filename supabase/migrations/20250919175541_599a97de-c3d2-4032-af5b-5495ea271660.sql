-- Get information about existing constraints on team_members table
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'team_members')
  AND contype = 'c';