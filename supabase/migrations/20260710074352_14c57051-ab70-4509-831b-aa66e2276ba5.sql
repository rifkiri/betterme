ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notify_goal_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_task_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_output_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_assignment_response boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_daily_digest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_mention boolean NOT NULL DEFAULT true;