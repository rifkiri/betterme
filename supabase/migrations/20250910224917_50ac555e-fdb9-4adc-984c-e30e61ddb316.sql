-- Clean up duplicate pomodoro sessions before adding constraints
-- Keep only the latest record for each unique combination

WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY session_id, session_type, pomodoro_number, break_number 
           ORDER BY created_at DESC, completed_at DESC NULLS LAST
         ) as rn
  FROM public.pomodoro_sessions
)
DELETE FROM public.pomodoro_sessions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.pomodoro_sessions 
ADD CONSTRAINT unique_session_completion 
UNIQUE (session_id, session_type, pomodoro_number, break_number);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session_id_type ON public.pomodoro_sessions (session_id, session_type);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_user ON public.pomodoro_sessions (task_id, user_id) WHERE task_id IS NOT NULL;