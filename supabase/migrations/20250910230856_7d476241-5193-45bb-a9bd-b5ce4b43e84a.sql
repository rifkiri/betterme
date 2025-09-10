-- Step 1: Add new session status types for clear distinction
-- Update existing session_status to support new values
-- Note: We can't use ALTER TYPE to add enum values in a transaction, so we'll use text with constraints

-- First, drop the existing constraint if it exists
ALTER TABLE public.pomodoro_sessions 
DROP CONSTRAINT IF EXISTS pomodoro_sessions_session_status_check;

-- Add new check constraint with all status types
ALTER TABLE public.pomodoro_sessions 
ADD CONSTRAINT pomodoro_sessions_session_status_check 
CHECK (session_status IN ('completed', 'stopped', 'skipped', 'terminated'));

-- Update database function to only count truly completed sessions (not stopped/skipped)
CREATE OR REPLACE FUNCTION public.update_task_pomodoro_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle INSERT (new session completed)
  IF TG_OP = 'INSERT' THEN
    -- Only count sessions with status 'completed' (timer reached 00:00)
    -- Exclude 'stopped', 'skipped', and 'terminated' sessions
    IF NEW.session_status = 'completed' THEN
      -- Upsert stats record
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
      ) VALUES (
        COALESCE(NEW.task_id, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.user_id,
        CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.completed_at ELSE NULL END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at ELSE NULL END,
        NOW()
      )
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET
        work_sessions_count = task_pomodoro_stats.work_sessions_count + 
          CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        work_duration_total = task_pomodoro_stats.work_duration_total + 
          CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        break_sessions_count = task_pomodoro_stats.break_sessions_count + 
          CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        break_duration_total = task_pomodoro_stats.break_duration_total + 
          CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        last_work_session_at = CASE 
          WHEN NEW.session_type = 'work' THEN NEW.completed_at 
          ELSE task_pomodoro_stats.last_work_session_at 
        END,
        last_break_session_at = CASE 
          WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at 
          ELSE task_pomodoro_stats.last_break_session_at 
        END,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE (session status changed)
  IF TG_OP = 'UPDATE' THEN
    -- If session status changed, recalculate stats
    IF OLD.session_status != NEW.session_status THEN
      -- Recalculate from scratch for this task/user
      IF NEW.task_id IS NOT NULL THEN
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
          NEW.task_id,
          NEW.user_id,
          COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed'), 0),
          COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'), 0),
          MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
          MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
          NOW()
        FROM public.pomodoro_sessions 
        WHERE task_id = NEW.task_id AND user_id = NEW.user_id
        ON CONFLICT (task_id, user_id) 
        DO UPDATE SET
          work_sessions_count = EXCLUDED.work_sessions_count,
          work_duration_total = EXCLUDED.work_duration_total,
          break_sessions_count = EXCLUDED.break_sessions_count,
          break_duration_total = EXCLUDED.break_duration_total,
          last_work_session_at = EXCLUDED.last_work_session_at,
          last_break_session_at = EXCLUDED.last_break_session_at,
          updated_at = NOW();
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE (session removed)
  IF TG_OP = 'DELETE' THEN
    IF OLD.task_id IS NOT NULL THEN
      -- Recalculate stats after deletion
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
        OLD.task_id,
        OLD.user_id,
        COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed'), 0),
        COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'), 0),
        MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
        MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
        NOW()
      FROM public.pomodoro_sessions 
      WHERE task_id = OLD.task_id AND user_id = OLD.user_id
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET
        work_sessions_count = EXCLUDED.work_sessions_count,
        work_duration_total = EXCLUDED.work_duration_total,
        break_sessions_count = EXCLUDED.break_sessions_count,
        break_duration_total = EXCLUDED.break_duration_total,
        last_work_session_at = EXCLUDED.last_work_session_at,
        last_break_session_at = EXCLUDED.last_break_session_at,
        updated_at = NOW();
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;