-- Update task type constraint to support new, bug, testing
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_type_check;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_type_check 
CHECK (type IN ('new', 'bug', 'testing', 'task', 'milestone'));

-- Add new columns for images and remarks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS description_image_url text,
ADD COLUMN IF NOT EXISTS remarks text,
ADD COLUMN IF NOT EXISTS remarks_image_url text;