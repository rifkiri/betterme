-- Add linked_goal_id column to habits table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'habits' AND column_name = 'linked_goal_id') THEN
        ALTER TABLE public.habits ADD COLUMN linked_goal_id UUID;
    END IF;
END $$;

-- Create goal_notifications table
CREATE TABLE IF NOT EXISTS public.goal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    goal_id UUID NOT NULL,
    notification_type TEXT NOT NULL,
    role TEXT,
    acknowledged BOOLEAN DEFAULT false,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create goal_assignments table
CREATE TABLE IF NOT EXISTS public.goal_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
    assigned_by UUID,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    acknowledged BOOLEAN DEFAULT false,
    self_assigned BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.goal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_notifications
CREATE POLICY "Users can view their own notifications" ON public.goal_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.goal_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.goal_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.goal_notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all notifications" ON public.goal_notifications
    FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- RLS policies for goal_assignments
CREATE POLICY "Users can view their own assignments" ON public.goal_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert assignments" ON public.goal_assignments
    FOR INSERT WITH CHECK (auth.uid() = assigned_by OR auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON public.goal_assignments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON public.goal_assignments
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = assigned_by);

CREATE POLICY "Managers can view all assignments" ON public.goal_assignments
    FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Managers can manage all assignments" ON public.goal_assignments
    FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Add updated_at triggers
CREATE TRIGGER update_goal_notifications_updated_at
    BEFORE UPDATE ON public.goal_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_assignments_updated_at
    BEFORE UPDATE ON public.goal_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();