-- Drop the incorrect policy
DROP POLICY "Users can view work goals for joining" ON public.goals;

-- Create the correct policy that allows users to see work goals they can join
CREATE POLICY "Users can view work goals to join"
ON public.goals
FOR SELECT
USING (
  category = 'work' 
  AND progress < 100
  AND NOT archived
  AND NOT is_deleted
  AND NOT (
    -- Exclude goals where user is already involved as member, lead, or coach
    auth.uid() = ANY(member_ids) OR 
    auth.uid() = ANY(lead_ids) OR 
    auth.uid() = coach_id
  )
);