-- Remove role restrictions on goal creation - allow all authenticated users to create work goals
-- Update existing RLS policy to allow all users to create any type of goal
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;

CREATE POLICY "All users can create goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure only goal creators can permanently delete goals (this should already be correct but let's be explicit)
-- The existing delete policy should already handle this correctly