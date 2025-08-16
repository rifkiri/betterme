-- Clean up conflicting RLS policies on goals table
-- First drop the redundant and potentially conflicting policies

-- Drop duplicate select policies that might be conflicting
DROP POLICY IF EXISTS "All authenticated users can view all goals" ON goals;
DROP POLICY IF EXISTS "Managers can access all team member goals" ON goals;
DROP POLICY IF EXISTS "Users can only modify their own goals" ON goals;

-- Keep the essential policies and ensure they work correctly
-- Policy for users to view their own goals (already exists: "Users can view their own goals")
-- Policy for users to create their own goals (already exists: "Users can create their own goals") 
-- Policy for users to update their own goals (already exists: "Users can update their own goals or assigned goals")
-- Policy for users to delete their own goals (already exists: "Users can delete their own goals")

-- Add a simple policy for managers and admins to view all goals
CREATE POLICY "Managers and admins can view all goals" ON goals
FOR SELECT USING (
  get_user_role(auth.uid()) IN ('manager', 'admin')
);

-- Add a policy for managers and admins to manage all goals
CREATE POLICY "Managers and admins can manage all goals" ON goals
FOR ALL USING (
  get_user_role(auth.uid()) IN ('manager', 'admin')
);

-- Ensure the existing admin policy is sufficient (already exists: "Admins can manage all goals")