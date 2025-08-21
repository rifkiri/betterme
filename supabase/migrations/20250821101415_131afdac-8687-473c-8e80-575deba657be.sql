-- Add linked_goal_id column to habits table for linking habits to personal goals
ALTER TABLE public.habits 
ADD COLUMN linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;