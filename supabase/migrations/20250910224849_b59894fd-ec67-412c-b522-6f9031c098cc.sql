-- Add unique constraints to prevent duplicate pomodoro sessions
-- This prevents the same session from being saved multiple times

-- Add unique constraint on pomodoro_sessions to prevent duplicates
ALTER TABLE public.pomodoro_sessions 
ADD CONSTRAINT unique_session_completion 
UNIQUE (session_id, session_type, pomodoro_number, break_number);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session_id_type ON public.pomodoro_sessions (session_id, session_type);

-- Add index for task-based queries
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_user ON public.pomodoro_sessions (task_id, user_id) WHERE task_id IS NOT NULL;