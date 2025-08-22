-- Update get_habits_for_date function to include linked_goal_id
CREATE OR REPLACE FUNCTION public.get_habits_for_date(user_id_param uuid, target_date date)
 RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.description,
    h.category::TEXT,
    h.streak,
    h.archived,
    h.is_deleted,
    h.created_at,
    COALESCE(hc.completed_date IS NOT NULL, FALSE) as completed,
    h.linked_goal_id
  FROM habits h
  LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completed_date = target_date
  WHERE h.user_id = user_id_param
  ORDER BY h.created_at DESC;
END;
$function$