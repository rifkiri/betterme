-- Clean up duplicate pomodoro sessions that may have been created
-- Keep only the earliest session for each unique combination of task_id, pomodoro_number, and session_type
DELETE FROM pomodoro_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (task_id, pomodoro_number, session_type) id
  FROM pomodoro_sessions 
  ORDER BY task_id, pomodoro_number, session_type, created_at ASC
);