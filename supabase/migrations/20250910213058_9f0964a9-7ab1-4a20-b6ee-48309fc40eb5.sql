-- Fix existing pomodoro sessions that completed naturally but are missing interrupted field
-- Set interrupted = false for sessions that completed with session_status = 'completed' and interrupted is null
UPDATE pomodoro_sessions 
SET interrupted = false 
WHERE session_status = 'completed' 
AND interrupted IS NULL;

-- Ensure future sessions have proper default
ALTER TABLE pomodoro_sessions 
ALTER COLUMN interrupted SET DEFAULT false;