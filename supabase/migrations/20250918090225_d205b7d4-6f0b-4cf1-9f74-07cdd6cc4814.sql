-- Add visibility column to goals table
ALTER TABLE public.goals 
ADD COLUMN visibility text DEFAULT 'all' CHECK (visibility IN ('all', 'managers', 'self'));

-- Update RLS policies for goals table
-- Drop the existing "Authenticated users can view active goals" policy
DROP POLICY IF EXISTS "Authenticated users can view active goals" ON public.goals;

-- Create new policy that respects visibility settings
CREATE POLICY "Users can view goals based on visibility" 
ON public.goals 
FOR SELECT 
USING (
  -- User can always see their own goals
  auth.uid() = user_id
  OR
  -- Admins can see all goals
  get_user_role(auth.uid()) = 'admin'
  OR
  -- For non-deleted, non-archived goals, check visibility
  (
    NOT is_deleted 
    AND NOT archived
    AND (
      -- 'all' visibility: everyone can see
      (visibility = 'all')
      OR
      -- 'managers' visibility: only managers and admins can see
      (visibility = 'managers' AND get_user_role(auth.uid()) IN ('manager', 'admin'))
      OR
      -- 'self' visibility is already handled by the first condition (auth.uid() = user_id)
      FALSE
    )
  )
  OR
  -- Users can see goals they're assigned to regardless of visibility
  EXISTS (
    SELECT 1 FROM public.goal_assignments 
    WHERE goal_id = goals.id 
    AND user_id = auth.uid()
  )
);