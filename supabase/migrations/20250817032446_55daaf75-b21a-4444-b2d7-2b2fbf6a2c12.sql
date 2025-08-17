-- Allow users to view work goals for joining purposes
-- This enables team members to see work goals they can join
CREATE POLICY "Users can view work goals for joining"
ON public.goals
FOR SELECT
USING (
  category = 'work' 
  AND (
    -- Users can see work goals that they are not already members of
    auth.uid() != user_id OR auth.uid() = ANY(member_ids) OR auth.uid() = ANY(lead_ids) OR auth.uid() = coach_id
  )
);