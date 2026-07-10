REVOKE EXECUTE ON FUNCTION public.get_filtered_users_for_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_habit_completion(uuid, uuid, date, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_goal_assignment(uuid, uuid, text, uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_goal_notification(uuid, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_habits_for_date(uuid, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_filtered_users_for_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_habit_completion(uuid, uuid, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_assignment(uuid, uuid, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_notification(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_habits_for_date(uuid, date) TO authenticated;

REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.goals FROM anon;
REVOKE SELECT ON TABLE public.tasks FROM anon;
REVOKE SELECT ON TABLE public.habits FROM anon;
REVOKE SELECT ON TABLE public.weekly_outputs FROM anon;
REVOKE SELECT ON TABLE public.mood_entries FROM anon;