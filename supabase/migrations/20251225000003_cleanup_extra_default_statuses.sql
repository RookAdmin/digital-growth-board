-- Cleanup migration: Remove extra default statuses that were auto-created
-- Keep only the 3 required defaults: New, Converted, Dropped
-- This allows each workspace to create their own custom statuses

-- Delete the extra statuses that were auto-created (Contacted, Qualified, Proposal Sent, Approvals)
-- Only if they are not default statuses (is_default = false)
DELETE FROM public.lead_statuses
WHERE name IN ('Contacted', 'Qualified', 'Proposal Sent', 'Approvals')
AND is_default = false;

-- Note: This migration ensures that only the 3 required default statuses exist
-- Workspaces can then create their own custom statuses through the Settings page

