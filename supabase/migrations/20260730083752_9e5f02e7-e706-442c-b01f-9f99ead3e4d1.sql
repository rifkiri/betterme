DO $$ 
DECLARE pol RECORD;
BEGIN 
    FOR pol IN 
        SELECT tablename, policyname FROM pg_policies 
        WHERE schemaname = 'public' AND roles @> ARRAY['public'::name]
          AND tablename IN ('active_pomodoro_sessions', 'habits', 'habit_completions', 'mood_entries', 'goals', 'profiles', 'pomodoro_sessions', 'task_pomodoro_stats', 'weekly_outputs', 'integration_connections', 'integration_sync_logs', 'goal_assignments', 'tasks')
    LOOP
        EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Task owners and leaders can manage task invitations" ON public.task_invitations;
CREATE POLICY "Task owners and leaders can manage task invitations"
ON public.task_invitations FOR UPDATE TO authenticated
USING (invited_by = auth.uid() OR invitee_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_invitations.task_id AND t.user_id = auth.uid()))
WITH CHECK (invited_by = auth.uid() OR invitee_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_invitations.task_id AND t.user_id = auth.uid()));

DO $$
DECLARE func RECORD;
BEGIN
    FOR func IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, public;', func.proname, func.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated;', func.proname, func.args);
    END LOOP;
END $$;

REVOKE USAGE ON SCHEMA graphql FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA graphql FROM anon;