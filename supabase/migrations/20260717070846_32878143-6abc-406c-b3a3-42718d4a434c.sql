
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_goal_owner(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_goal_assignee(uuid, uuid) TO authenticated, anon;
