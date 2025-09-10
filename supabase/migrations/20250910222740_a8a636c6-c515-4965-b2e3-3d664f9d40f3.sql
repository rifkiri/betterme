-- Create task_pomodoro_stats table for O(1) counter queries
CREATE TABLE public.task_pomodoro_stats (
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  work_sessions_count INTEGER NOT NULL DEFAULT 0,
  work_duration_total INTEGER NOT NULL DEFAULT 0, -- in minutes
  break_sessions_count INTEGER NOT NULL DEFAULT 0,
  break_duration_total INTEGER NOT NULL DEFAULT 0, -- in minutes
  last_work_session_at TIMESTAMP WITH TIME ZONE,
  last_break_session_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own task stats" 
ON public.task_pomodoro_stats 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all task stats" 
ON public.task_pomodoro_stats 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create indexes for performance
CREATE INDEX idx_task_pomodoro_stats_task_id ON public.task_pomodoro_stats(task_id);
CREATE INDEX idx_task_pomodoro_stats_user_id ON public.task_pomodoro_stats(user_id);
CREATE INDEX idx_task_pomodoro_stats_updated_at ON public.task_pomodoro_stats(updated_at);

-- Function to update task pomodoro stats
CREATE OR REPLACE FUNCTION public.update_task_pomodoro_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new session completed)
  IF TG_OP = 'INSERT' THEN
    -- Only count completed, non-interrupted sessions
    IF NEW.session_status = 'completed' AND NEW.interrupted = false THEN
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
    -- If session was marked as interrupted or status changed, recalculate
    IF (OLD.interrupted != NEW.interrupted) OR (OLD.session_status != NEW.session_status) THEN
      -- For simplicity, we'll recalculate the entire stats for this task/user
      -- This ensures accuracy even if sessions are modified after creation
      
      IF NEW.task_id IS NOT NULL THEN
        -- Recalculate from scratch
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
          COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false), 0),
          COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false), 0),
          MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
          MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
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
        COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false), 0),
        COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false), 0),
        MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
        MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on pomodoro_sessions
CREATE TRIGGER update_task_pomodoro_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pomodoro_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_task_pomodoro_stats();

-- Migrate existing data
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
  COALESCE(task_id, '00000000-0000-0000-0000-000000000000'::uuid) as task_id,
  user_id,
  COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false) as work_sessions_count,
  COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false), 0) as work_duration_total,
  COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false) as break_sessions_count,
  COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false), 0) as break_duration_total,
  MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false) as last_work_session_at,
  MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false) as last_break_session_at,
  NOW() as updated_at
FROM public.pomodoro_sessions 
WHERE session_status = 'completed' AND interrupted = false
GROUP BY COALESCE(task_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id
HAVING COUNT(*) > 0;

-- Enable realtime for the new table
ALTER TABLE public.task_pomodoro_stats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_pomodoro_stats;