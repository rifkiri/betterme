-- Lock down all remaining SECURITY DEFINER functions from PUBLIC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_task_pomodoro_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_password_strength(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_default_notification_preferences() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_weekly_outputs_updated_at() FROM PUBLIC;

-- Grant back only to authenticated for functions the app calls directly
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;

-- Revoke SELECT from anon on all remaining public tables
REVOKE SELECT ON TABLE public.active_pomodoro_sessions FROM anon;
REVOKE SELECT ON TABLE public.goal_assignments FROM anon;
REVOKE SELECT ON TABLE public.goal_notifications FROM anon;
REVOKE SELECT ON TABLE public.habit_completions FROM anon;
REVOKE SELECT ON TABLE public.integration_connections FROM anon;
REVOKE SELECT ON TABLE public.integration_sync_logs FROM anon;
REVOKE SELECT ON TABLE public.notification_preferences FROM anon;
REVOKE SELECT ON TABLE public.pomodoro_sessions FROM anon;
REVOKE SELECT ON TABLE public.task_pomodoro_stats FROM anon;