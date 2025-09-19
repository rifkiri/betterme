-- Add visibility column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN visibility text DEFAULT 'all'::text;

-- Add visibility column to weekly_outputs table  
ALTER TABLE public.weekly_outputs
ADD COLUMN visibility text DEFAULT 'all'::text;

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "All authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can view all tasks" ON public.tasks;

-- Create new visibility-based policy for tasks
CREATE POLICY "Users can view tasks based on visibility" 
ON public.tasks 
FOR SELECT 
USING (
  -- Users can always see their own tasks
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all tasks
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted tasks with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
      OR visibility IS NULL -- for backward compatibility
    )
  ) 
  OR 
  -- Team members can see non-deleted tasks with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (visibility = 'all'::text OR visibility IS NULL)
  ) 
  OR 
  -- Tagged users can see tasks they're tagged in
  (
    auth.uid() = ANY(tagged_users)
  )
);

-- Update RLS policies for weekly_outputs
DROP POLICY IF EXISTS "All authenticated users can view all weekly outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Managers and admins can view all weekly outputs" ON public.weekly_outputs;

-- Create new visibility-based policy for weekly_outputs
CREATE POLICY "Users can view weekly outputs based on visibility" 
ON public.weekly_outputs 
FOR SELECT 
USING (
  -- Users can always see their own outputs
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all outputs
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted outputs with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
      OR visibility IS NULL -- for backward compatibility
    )
  ) 
  OR 
  -- Team members can see non-deleted outputs with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (visibility = 'all'::text OR visibility IS NULL)
  )
);