-- Fix goal joining functionality by relaxing RLS policies for collaboration

-- Update goal_assignments policies to allow collaboration
DROP POLICY IF EXISTS "Users can insert assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.goal_assignments;

-- Allow authenticated users to create goal assignments for joining goals
CREATE POLICY "Authenticated users can create goal assignments" 
ON public.goal_assignments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to view assignments for goals they can see
CREATE POLICY "Users can view goal assignments for accessible goals" 
ON public.goal_assignments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.goals g 
    WHERE g.id = goal_assignments.goal_id 
    AND (NOT g.is_deleted AND NOT g.archived)
  )
);

-- Keep the existing update policy for users to acknowledge their assignments
-- Users can update their own assignments (keep existing)

-- Ensure goals are properly visible for collaboration
DROP POLICY IF EXISTS "All users can view all active goals" ON public.goals;

CREATE POLICY "Authenticated users can view active goals" 
ON public.goals 
FOR SELECT 
TO authenticated
USING (NOT is_deleted AND NOT archived);

-- Create a security definer function for safe goal assignment creation
CREATE OR REPLACE FUNCTION public.create_goal_assignment(
  p_goal_id uuid,
  p_user_id uuid,
  p_role text,
  p_assigned_by uuid,
  p_self_assigned boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the goal assignment
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
  );
END;
$$;

-- Create a function to safely create goal notifications
CREATE OR REPLACE FUNCTION public.create_goal_notification(
  p_user_id uuid,
  p_goal_id uuid,
  p_notification_type text,
  p_role text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the goal notification
  INSERT INTO public.goal_notifications (
    user_id,
    goal_id,
    notification_type,
    role,
    acknowledged
  ) VALUES (
    p_user_id,
    p_goal_id,
    p_notification_type,
    p_role,
    false
  );
END;
$$;