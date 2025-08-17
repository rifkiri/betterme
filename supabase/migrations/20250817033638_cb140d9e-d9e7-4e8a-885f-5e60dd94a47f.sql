-- Drop the faulty RLS policy
DROP POLICY IF EXISTS "Users can view work goals to join" ON public.goals;

-- Create corrected RLS policy that properly excludes goal owners
CREATE POLICY "Team members can view joinable work goals" 
  ON public.goals 
  FOR SELECT 
  USING (
    category = 'work' 
    AND progress < 100 
    AND NOT archived 
    AND NOT is_deleted 
    AND auth.uid() != user_id  -- Don't show own goals
    AND NOT (auth.uid() = ANY (member_ids))  -- Not already a member
    AND NOT (auth.uid() = ANY (lead_ids))    -- Not already a lead
    AND (coach_id IS NULL OR auth.uid() != coach_id)  -- Not already a coach
  );