ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.weekly_outputs REPLICA IDENTITY FULL;
ALTER TABLE public.task_invitations REPLICA IDENTITY FULL;
ALTER TABLE public.goal_assignments REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'weekly_outputs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_outputs;
  END IF;
END $$;