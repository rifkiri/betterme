-- Update RLS policies to allow all users to see all goals
-- Drop the restrictive team member policy for viewing joinable work goals
DROP POLICY IF EXISTS "Team members can view joinable work goals" ON goals;

-- Create a new policy that allows all authenticated users to view all active goals
CREATE POLICY "All users can view all active goals" 
ON goals 
FOR SELECT 
TO authenticated
USING (NOT is_deleted AND NOT archived);