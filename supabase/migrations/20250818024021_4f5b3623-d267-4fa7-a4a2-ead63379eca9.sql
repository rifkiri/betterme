-- Drop the restrictive policy that only allows self-assignment as member
DROP POLICY "Users can create self-assignments as members" ON goal_assignments;

-- Create new policy allowing self-assignment to any role
CREATE POLICY "Users can create self-assignments to any role" 
ON goal_assignments FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND (self_assigned = true)
);