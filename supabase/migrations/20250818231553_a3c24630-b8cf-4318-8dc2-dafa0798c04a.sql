-- Create function to cleanup stale linkages
CREATE OR REPLACE FUNCTION public.cleanup_stale_linkages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove linkages to deleted/archived goals
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'goal' AND EXISTS (
    SELECT 1 FROM goals g 
    WHERE g.id::text = il.source_id 
    AND (g.is_deleted = true OR g.archived = true)
  ))
  OR (il.target_type = 'goal' AND EXISTS (
    SELECT 1 FROM goals g 
    WHERE g.id::text = il.target_id 
    AND (g.is_deleted = true OR g.archived = true)
  ));

  -- Remove linkages to deleted weekly outputs
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'weekly_output' AND EXISTS (
    SELECT 1 FROM weekly_outputs wo 
    WHERE wo.id::text = il.source_id 
    AND wo.is_deleted = true
  ))
  OR (il.target_type = 'weekly_output' AND EXISTS (
    SELECT 1 FROM weekly_outputs wo 
    WHERE wo.id::text = il.target_id 
    AND wo.is_deleted = true
  ));

  -- Remove linkages to deleted tasks
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'task' AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id::text = il.source_id 
    AND t.is_deleted = true
  ))
  OR (il.target_type = 'task' AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id::text = il.target_id 
    AND t.is_deleted = true
  ));

  -- Remove linkages to deleted/archived habits
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'habit' AND EXISTS (
    SELECT 1 FROM habits h 
    WHERE h.id::text = il.source_id 
    AND (h.is_deleted = true OR h.archived = true)
  ))
  OR (il.target_type = 'habit' AND EXISTS (
    SELECT 1 FROM habits h 
    WHERE h.id::text = il.target_id 
    AND (h.is_deleted = true OR h.archived = true)
  ));
END;
$$;

-- Update get_item_linkages function to filter out inactive items
CREATE OR REPLACE FUNCTION public.get_item_linkages(p_item_type text, p_item_id text, p_user_id uuid)
RETURNS TABLE(target_type text, target_id text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.target_type,
    il.target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.source_type = p_item_type 
    AND il.source_id = p_item_id
    AND il.user_id = p_user_id
    AND (
      -- Filter active goals
      (il.target_type = 'goal' AND EXISTS (
        SELECT 1 FROM goals g 
        WHERE g.id::text = il.target_id 
        AND g.is_deleted = false 
        AND g.archived = false
      ))
      OR
      -- Filter active weekly outputs
      (il.target_type = 'weekly_output' AND EXISTS (
        SELECT 1 FROM weekly_outputs wo 
        WHERE wo.id::text = il.target_id 
        AND wo.is_deleted = false
      ))
      OR
      -- Filter active tasks
      (il.target_type = 'task' AND EXISTS (
        SELECT 1 FROM tasks t 
        WHERE t.id::text = il.target_id 
        AND t.is_deleted = false
      ))
      OR
      -- Filter active habits
      (il.target_type = 'habit' AND EXISTS (
        SELECT 1 FROM habits h 
        WHERE h.id::text = il.target_id 
        AND h.is_deleted = false 
        AND h.archived = false
      ))
    )
  
  UNION
  
  SELECT 
    il.source_type as target_type,
    il.source_id as target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.target_type = p_item_type 
    AND il.target_id = p_item_id
    AND il.user_id = p_user_id
    AND (
      -- Filter active goals
      (il.source_type = 'goal' AND EXISTS (
        SELECT 1 FROM goals g 
        WHERE g.id::text = il.source_id 
        AND g.is_deleted = false 
        AND g.archived = false
      ))
      OR
      -- Filter active weekly outputs
      (il.source_type = 'weekly_output' AND EXISTS (
        SELECT 1 FROM weekly_outputs wo 
        WHERE wo.id::text = il.source_id 
        AND wo.is_deleted = false
      ))
      OR
      -- Filter active tasks
      (il.source_type = 'task' AND EXISTS (
        SELECT 1 FROM tasks t 
        WHERE t.id::text = il.source_id 
        AND t.is_deleted = false
      ))
      OR
      -- Filter active habits
      (il.source_type = 'habit' AND EXISTS (
        SELECT 1 FROM habits h 
        WHERE h.id::text = il.source_id 
        AND h.is_deleted = false 
        AND h.archived = false
      ))
    );
END;
$$;

-- Create trigger function to cleanup linkages on item deletion/archiving
CREATE OR REPLACE FUNCTION public.cleanup_item_linkages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For goals table
  IF TG_TABLE_NAME = 'goals' THEN
    IF NEW.is_deleted = true OR NEW.archived = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'goal' AND source_id = NEW.id::text) OR
        (target_type = 'goal' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  -- For weekly_outputs table
  IF TG_TABLE_NAME = 'weekly_outputs' THEN
    IF NEW.is_deleted = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'weekly_output' AND source_id = NEW.id::text) OR
        (target_type = 'weekly_output' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  -- For tasks table
  IF TG_TABLE_NAME = 'tasks' THEN
    IF NEW.is_deleted = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'task' AND source_id = NEW.id::text) OR
        (target_type = 'task' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  -- For habits table
  IF TG_TABLE_NAME = 'habits' THEN
    IF NEW.is_deleted = true OR NEW.archived = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'habit' AND source_id = NEW.id::text) OR
        (target_type = 'habit' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for automatic cleanup
CREATE TRIGGER cleanup_goal_linkages_trigger
  AFTER UPDATE ON goals
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR OLD.archived IS DISTINCT FROM NEW.archived)
  EXECUTE FUNCTION cleanup_item_linkages();

CREATE TRIGGER cleanup_weekly_output_linkages_trigger
  AFTER UPDATE ON weekly_outputs
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION cleanup_item_linkages();

CREATE TRIGGER cleanup_task_linkages_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION cleanup_item_linkages();

CREATE TRIGGER cleanup_habit_linkages_trigger
  AFTER UPDATE ON habits
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR OLD.archived IS DISTINCT FROM NEW.archived)
  EXECUTE FUNCTION cleanup_item_linkages();

-- Clean up existing stale linkages
SELECT cleanup_stale_linkages();