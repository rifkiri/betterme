-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL DEFAULT 100,
  current_value INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'percent',
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('daily', 'weekly', 'monthly', 'custom')),
  deadline DATE,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  linked_output_ids TEXT[] DEFAULT '{}'::TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Managers can access all team member goals" 
ON public.goals 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Admins can manage all goals" 
ON public.goals 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::text);

CREATE POLICY "All authenticated users can view all goals" 
ON public.goals 
FOR SELECT 
USING (true);

CREATE POLICY "Users can only modify their own goals" 
ON public.goals 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add goal relationship columns to existing tables
ALTER TABLE public.weekly_outputs 
ADD COLUMN IF NOT EXISTS linked_goal_ids TEXT[] DEFAULT '{}'::TEXT[];

-- Create index for better performance on goal queries
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_category ON public.goals(category);
CREATE INDEX idx_goals_deadline ON public.goals(deadline);
CREATE INDEX idx_weekly_outputs_linked_goal_ids ON public.weekly_outputs USING GIN(linked_goal_ids);