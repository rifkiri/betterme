-- Final cleanup: Update existing sessions to use proper status values
-- Convert old interrupted sessions to proper status types

-- Update interrupted work/break sessions to 'stopped' status  
UPDATE public.pomodoro_sessions 
SET session_status = 'stopped'
WHERE interrupted = true 
  AND session_status = 'completed';

-- Ensure all non-interrupted sessions are marked as 'completed'
UPDATE public.pomodoro_sessions 
SET session_status = 'completed'
WHERE interrupted = false 
  AND session_status != 'completed';

-- Recalculate all task pomodoro stats to ensure accuracy after status changes
-- This will rebuild all stats based on the new session_status = 'completed' logic
DELETE FROM public.task_pomodoro_stats;

-- Trigger will automatically rebuild stats as we insert sessions
-- Insert a dummy session to trigger recalculation for all users/tasks
DO $$
DECLARE
    task_user_combo RECORD;
BEGIN
    FOR task_user_combo IN 
        SELECT DISTINCT task_id, user_id 
        FROM public.pomodoro_sessions 
        WHERE task_id IS NOT NULL
    LOOP
        INSERT INTO public.task_pomodoro_stats (
            task_id, 
            user_id, 
            work_sessions_count,
            work_duration_total,
            break_sessions_count,
            break_duration_total,
            last_work_session_at,
            last_break_session_at,
            updated_at
        )
        SELECT 
            task_user_combo.task_id,
            task_user_combo.user_id,
            COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
            COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed'), 0),
            COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
            COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'), 0),
            MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
            MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
            NOW()
        FROM public.pomodoro_sessions 
        WHERE task_id = task_user_combo.task_id AND user_id = task_user_combo.user_id;
    END LOOP;
END $$;