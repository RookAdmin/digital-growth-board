
-- Add a column to store the meeting link
ALTER TABLE public.meeting_slots
ADD COLUMN meeting_link TEXT;
