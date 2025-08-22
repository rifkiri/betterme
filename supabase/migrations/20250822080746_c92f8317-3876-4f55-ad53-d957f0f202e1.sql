-- Phase 1: Create missing database functions and tables

-- Create habit_completions table for tracking daily habit completions
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- Enable RLS on habit_completions
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for habit_completions
CREATE POLICY "Users can manage their own habit completions"
ON public.habit_completions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all habit completions"
ON public.habit_completions
FOR SELECT
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create function to toggle habit completion
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(
  p_habit_id UUID,
  p_user_id UUID,
  p_date DATE,
  p_completed BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_completed THEN
    -- Insert completion record if it doesn't exist
    INSERT INTO public.habit_completions (habit_id, user_id, completed_date)
    VALUES (p_habit_id, p_user_id, p_date)
    ON CONFLICT (habit_id, completed_date) DO NOTHING;
    
    -- Update habit's last_completed_date
    UPDATE public.habits 
    SET last_completed_date = p_date,
        streak = CASE 
          WHEN last_completed_date = p_date - INTERVAL '1 day' THEN streak + 1
          WHEN last_completed_date IS NULL OR last_completed_date < p_date - INTERVAL '1 day' THEN 1
          ELSE streak
        END
    WHERE id = p_habit_id AND user_id = p_user_id;
  ELSE
    -- Remove completion record
    DELETE FROM public.habit_completions 
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = p_user_id;
    
    -- Recalculate streak (simplified - just reset to 0 for now)
    UPDATE public.habits 
    SET streak = 0,
        last_completed_date = NULL
    WHERE id = p_habit_id AND user_id = p_user_id;
  END IF;
END;
$$;

-- Create functions for linking weekly outputs to goals
CREATE OR REPLACE FUNCTION public.link_output_to_goal(
  p_goal_id TEXT,
  p_output_id TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.item_linkages (source_type, source_id, target_type, target_id, user_id)
  VALUES ('goal', p_goal_id, 'weekly_output', p_output_id, p_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_output_from_goal(
  p_goal_id TEXT,
  p_output_id TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.item_linkages 
  WHERE ((source_type = 'goal' AND source_id = p_goal_id AND target_type = 'weekly_output' AND target_id = p_output_id)
    OR (source_type = 'weekly_output' AND source_id = p_output_id AND target_type = 'goal' AND target_id = p_goal_id))
    AND user_id = p_user_id;
END;
$$;