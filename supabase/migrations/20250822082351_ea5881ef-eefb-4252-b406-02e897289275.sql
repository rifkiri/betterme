-- Fix database issues after restoring to previous version

-- First, check if linked_goal_id column exists in habits table and add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'linked_goal_id'
    ) THEN
        ALTER TABLE public.habits ADD COLUMN linked_goal_id UUID REFERENCES public.goals(id);
    END IF;
END $$;

-- Create goal_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.goal_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('assignment', 'self_assignment')),
    role TEXT NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.goal_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
    assigned_by UUID NOT NULL REFERENCES public.profiles(id),
    assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    self_assigned BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure unique assignment per user/goal/role combination
    UNIQUE(goal_id, user_id, role)
);

-- Enable RLS on new tables
ALTER TABLE public.goal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goal_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.goal_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications for themselves" 
ON public.goal_notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.goal_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for goal_assignments
CREATE POLICY "Users can view assignments they're involved in" 
ON public.goal_assignments 
FOR SELECT 
USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_by OR
    EXISTS (
        SELECT 1 FROM public.goals g 
        WHERE g.id = goal_id AND g.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create assignments for goals they own" 
ON public.goal_assignments 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.goals g 
        WHERE g.id = goal_id AND g.user_id = auth.uid()
    ) OR
    auth.uid() = user_id -- Allow self-assignment
);

CREATE POLICY "Users can update assignments they created or own" 
ON public.goal_assignments 
FOR UPDATE 
USING (
    auth.uid() = assigned_by OR
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.goals g 
        WHERE g.id = goal_id AND g.user_id = auth.uid()
    )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_goal_notifications_updated_at
    BEFORE UPDATE ON public.goal_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_assignments_updated_at
    BEFORE UPDATE ON public.goal_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fix the get_habits_for_date function to handle the linked_goal_id column properly
CREATE OR REPLACE FUNCTION public.get_habits_for_date(user_id_param uuid, target_date date)
 RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.description,
    h.category::TEXT,
    h.streak,
    h.archived,
    h.is_deleted,
    h.created_at,
    COALESCE(hc.completed_date IS NOT NULL, FALSE) as completed,
    h.linked_goal_id
  FROM habits h
  LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completed_date = target_date
  WHERE h.user_id = user_id_param
  ORDER BY h.created_at DESC;
END;
$function$;

-- Create a function to handle habit completion toggle with proper parameter names
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF is_completed THEN
    -- Insert completion record if it doesn't exist
    INSERT INTO public.habit_completions (habit_id, user_id, completed_date)
    VALUES (habit_id_param, user_id_param, target_date)
    ON CONFLICT (habit_id, completed_date) DO NOTHING;
    
    -- Update habit's last_completed_date and streak
    UPDATE public.habits 
    SET last_completed_date = target_date,
        streak = CASE 
          WHEN last_completed_date = target_date - INTERVAL '1 day' THEN streak + 1
          WHEN last_completed_date IS NULL OR last_completed_date < target_date - INTERVAL '1 day' THEN 1
          ELSE streak
        END
    WHERE id = habit_id_param AND user_id = user_id_param;
  ELSE
    -- Remove completion record
    DELETE FROM public.habit_completions 
    WHERE habit_id = habit_id_param AND completed_date = target_date AND user_id = user_id_param;
    
    -- Recalculate streak (simplified - just reset to 0 for now)
    UPDATE public.habits 
    SET streak = 0,
        last_completed_date = NULL
    WHERE id = habit_id_param AND user_id = user_id_param;
  END IF;
END;
$function$;