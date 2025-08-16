-- Add missing foreign key constraints to goal_assignments table

-- Add foreign key constraint between goal_assignments.goal_id and goals.id
ALTER TABLE public.goal_assignments 
ADD CONSTRAINT fk_goal_assignments_goal_id 
FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;

-- Add foreign key constraint between goal_assignments.user_id and profiles.id
ALTER TABLE public.goal_assignments 
ADD CONSTRAINT fk_goal_assignments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint between goal_assignments.assigned_by and profiles.id
ALTER TABLE public.goal_assignments 
ADD CONSTRAINT fk_goal_assignments_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE CASCADE;