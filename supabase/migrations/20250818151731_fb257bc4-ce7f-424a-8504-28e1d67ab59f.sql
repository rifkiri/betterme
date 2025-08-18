-- Create function to link output to goal with proper permissions
CREATE OR REPLACE FUNCTION public.link_output_to_goal(
  output_id text,
  goal_id uuid,
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  goal_exists boolean;
  output_exists boolean;
  can_link boolean;
BEGIN
  -- Check if goal exists and user has access to it
  SELECT EXISTS(
    SELECT 1 FROM goals g
    WHERE g.id = goal_id
    AND (
      g.user_id = user_id_param OR
      EXISTS(SELECT 1 FROM goal_assignments ga WHERE ga.goal_id = g.id AND ga.user_id = user_id_param)
    )
    AND NOT g.is_deleted
    AND NOT g.archived
  ) INTO goal_exists;
  
  -- Check if weekly output exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM weekly_outputs wo
    WHERE wo.id::text = output_id
    AND wo.user_id = user_id_param
    AND NOT wo.is_deleted
  ) INTO output_exists;
  
  IF NOT goal_exists THEN
    RAISE EXCEPTION 'Goal not found or access denied';
  END IF;
  
  IF NOT output_exists THEN
    RAISE EXCEPTION 'Weekly output not found or access denied';
  END IF;
  
  -- Add goal_id to weekly output's linked_goal_ids if not already present
  UPDATE weekly_outputs
  SET linked_goal_ids = CASE
    WHEN goal_id::text = ANY(linked_goal_ids) THEN linked_goal_ids
    ELSE array_append(linked_goal_ids, goal_id::text)
  END
  WHERE id::text = output_id;
  
  -- Add output_id to goal's linked_output_ids if not already present
  UPDATE goals
  SET linked_output_ids = CASE
    WHEN output_id = ANY(linked_output_ids) THEN linked_output_ids
    ELSE array_append(linked_output_ids, output_id)
  END
  WHERE id = goal_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to unlink output from goal
CREATE OR REPLACE FUNCTION public.unlink_output_from_goal(
  output_id text,
  goal_id uuid,
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  goal_exists boolean;
  output_exists boolean;
BEGIN
  -- Check if goal exists and user has access to it
  SELECT EXISTS(
    SELECT 1 FROM goals g
    WHERE g.id = goal_id
    AND (
      g.user_id = user_id_param OR
      EXISTS(SELECT 1 FROM goal_assignments ga WHERE ga.goal_id = g.id AND ga.user_id = user_id_param)
    )
  ) INTO goal_exists;
  
  -- Check if weekly output exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM weekly_outputs wo
    WHERE wo.id::text = output_id
    AND wo.user_id = user_id_param
  ) INTO output_exists;
  
  IF NOT goal_exists THEN
    RAISE EXCEPTION 'Goal not found or access denied';
  END IF;
  
  IF NOT output_exists THEN
    RAISE EXCEPTION 'Weekly output not found or access denied';
  END IF;
  
  -- Remove goal_id from weekly output's linked_goal_ids
  UPDATE weekly_outputs
  SET linked_goal_ids = array_remove(linked_goal_ids, goal_id::text)
  WHERE id::text = output_id;
  
  -- Remove output_id from goal's linked_output_ids
  UPDATE goals
  SET linked_output_ids = array_remove(linked_output_ids, output_id)
  WHERE id = goal_id;
  
  RETURN TRUE;
END;
$$;