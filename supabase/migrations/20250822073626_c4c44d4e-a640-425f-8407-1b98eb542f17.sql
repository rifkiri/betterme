-- Phase 1: Database Schema Simplification and Cleanup (Fixed)

-- First, migrate any existing data from tables we're going to drop
-- Migrate goal assignments to a simpler approach using existing goals table
UPDATE goals 
SET member_ids = COALESCE(member_ids, '{}') || ARRAY[ga.user_id]
FROM goal_assignments ga 
WHERE goals.id = ga.goal_id 
AND NOT ga.user_id = ANY(COALESCE(goals.member_ids, '{}'));

-- Drop triggers that depend on functions we want to remove
DROP TRIGGER IF EXISTS cleanup_goal_linkages_trigger ON goals;
DROP TRIGGER IF EXISTS cleanup_weekly_output_linkages_trigger ON weekly_outputs;
DROP TRIGGER IF EXISTS cleanup_task_linkages_trigger ON tasks;
DROP TRIGGER IF EXISTS cleanup_habit_linkages_trigger ON habits;

-- Drop unused tables that add unnecessary complexity
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS goal_assignments CASCADE; 
DROP TABLE IF EXISTS goal_notifications CASCADE;
DROP TABLE IF EXISTS habit_completions CASCADE;

-- Simplify goals table - remove redundant linkage columns
ALTER TABLE goals DROP COLUMN IF EXISTS linked_output_ids;

-- Simplify weekly_outputs table - remove redundant linkage columns  
ALTER TABLE weekly_outputs DROP COLUMN IF EXISTS linked_goal_id;
ALTER TABLE weekly_outputs DROP COLUMN IF EXISTS linked_goal_ids;

-- Simplify habits table - remove redundant linkage columns
ALTER TABLE habits DROP COLUMN IF EXISTS linked_goal_id;

-- Optimize item_linkages table with proper indexes
CREATE INDEX IF NOT EXISTS idx_item_linkages_source ON item_linkages(user_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_item_linkages_target ON item_linkages(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_item_linkages_user_created ON item_linkages(user_id, created_at DESC);

-- Add composite unique constraint to prevent duplicate linkages
ALTER TABLE item_linkages DROP CONSTRAINT IF EXISTS unique_linkage;
ALTER TABLE item_linkages ADD CONSTRAINT unique_linkage UNIQUE (user_id, source_type, source_id, target_type, target_id);

-- Remove unused/complex database functions (now that triggers are gone)
DROP FUNCTION IF EXISTS public.link_output_to_goal(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.unlink_output_from_goal(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.toggle_habit_completion(uuid, uuid, date, boolean);
DROP FUNCTION IF EXISTS public.calculate_habit_streak(uuid, uuid);
DROP FUNCTION IF EXISTS public.cleanup_item_linkages();

-- Replace complex get_item_linkages with simpler version
DROP FUNCTION IF EXISTS public.get_item_linkages(text, text, uuid);
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
  
  UNION
  
  SELECT 
    il.source_type as target_type,
    il.source_id as target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.target_type = p_item_type 
    AND il.target_id = p_item_id
    AND il.user_id = p_user_id;
END;
$$;

-- Simplify cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_stale_linkages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple cleanup of linkages to deleted items
  DELETE FROM item_linkages il
  WHERE NOT EXISTS (
    SELECT 1 FROM goals g WHERE g.id::text = il.source_id AND il.source_type = 'goal' AND NOT g.is_deleted AND NOT g.archived
  ) AND il.source_type = 'goal'
  OR NOT EXISTS (
    SELECT 1 FROM goals g WHERE g.id::text = il.target_id AND il.target_type = 'goal' AND NOT g.is_deleted AND NOT g.archived  
  ) AND il.target_type = 'goal'
  OR NOT EXISTS (
    SELECT 1 FROM weekly_outputs w WHERE w.id::text = il.source_id AND il.source_type = 'weekly_output' AND NOT w.is_deleted
  ) AND il.source_type = 'weekly_output'
  OR NOT EXISTS (
    SELECT 1 FROM weekly_outputs w WHERE w.id::text = il.target_id AND il.target_type = 'weekly_output' AND NOT w.is_deleted
  ) AND il.target_type = 'weekly_output'
  OR NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.id::text = il.source_id AND il.source_type = 'task' AND NOT t.is_deleted
  ) AND il.source_type = 'task'
  OR NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.id::text = il.target_id AND il.target_type = 'task' AND NOT t.is_deleted
  ) AND il.target_type = 'task'
  OR NOT EXISTS (
    SELECT 1 FROM habits h WHERE h.id::text = il.source_id AND il.source_type = 'habit' AND NOT h.is_deleted AND NOT h.archived
  ) AND il.source_type = 'habit'
  OR NOT EXISTS (
    SELECT 1 FROM habits h WHERE h.id::text = il.target_id AND il.target_type = 'habit' AND NOT h.is_deleted AND NOT h.archived
  ) AND il.target_type = 'habit';
END;
$$;