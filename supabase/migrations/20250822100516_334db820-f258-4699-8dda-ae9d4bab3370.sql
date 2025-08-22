-- Migration to convert legacy goal member_ids/lead_ids/coach_id arrays to goal_assignments table
-- This will create proper goal_assignment records for existing relationships

-- Insert coach assignments from existing coach_id field
INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned, acknowledged)
SELECT 
  id as goal_id,
  coach_id as user_id,
  'coach' as role,
  user_id as assigned_by,
  false as self_assigned,
  true as acknowledged  -- Mark as acknowledged since these are existing relationships
FROM goals 
WHERE coach_id IS NOT NULL 
  AND NOT is_deleted 
  AND NOT archived;

-- Insert lead assignments from existing lead_ids array
INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned, acknowledged)
SELECT 
  g.id as goal_id,
  unnest(g.lead_ids) as user_id,
  'lead' as role,
  g.user_id as assigned_by,
  false as self_assigned,
  true as acknowledged  -- Mark as acknowledged since these are existing relationships
FROM goals g
WHERE array_length(g.lead_ids, 1) > 0 
  AND NOT g.is_deleted 
  AND NOT g.archived;

-- Insert member assignments from existing member_ids array
INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned, acknowledged)
SELECT 
  g.id as goal_id,
  unnest(g.member_ids) as user_id,
  'member' as role,
  g.user_id as assigned_by,
  false as self_assigned,
  true as acknowledged  -- Mark as acknowledged since these are existing relationships
FROM goals g
WHERE array_length(g.member_ids, 1) > 0 
  AND NOT g.is_deleted 
  AND NOT g.archived;

-- Clear the legacy arrays now that we have proper goal_assignments records
-- This ensures consistency and prevents confusion
UPDATE goals 
SET 
  member_ids = '{}',
  lead_ids = '{}',
  coach_id = NULL
WHERE NOT is_deleted AND NOT archived;