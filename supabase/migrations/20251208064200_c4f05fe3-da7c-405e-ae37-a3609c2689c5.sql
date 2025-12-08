-- First, clean up existing duplicate entries (keep only the most recent assignment per goal/user)
DELETE FROM goal_assignments 
WHERE id NOT IN (
  SELECT DISTINCT ON (goal_id, user_id) id 
  FROM goal_assignments 
  ORDER BY goal_id, user_id, assigned_date DESC NULLS LAST
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE goal_assignments 
ADD CONSTRAINT unique_goal_user_assignment UNIQUE (goal_id, user_id);

-- Update the create_goal_assignment function to use upsert
CREATE OR REPLACE FUNCTION public.create_goal_assignment(p_goal_id uuid, p_user_id uuid, p_role text, p_assigned_by uuid, p_self_assigned boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use upsert to prevent duplicates - update role if assignment already exists
  INSERT INTO public.goal_assignments (
    goal_id,
    user_id,
    role,
    assigned_by,
    self_assigned,
    acknowledged
  ) VALUES (
    p_goal_id,
    p_user_id,
    p_role,
    p_assigned_by,
    p_self_assigned,
    false
  )
  ON CONFLICT (goal_id, user_id) 
  DO UPDATE SET 
    role = p_role,
    assigned_by = p_assigned_by,
    updated_at = now();
END;
$function$;