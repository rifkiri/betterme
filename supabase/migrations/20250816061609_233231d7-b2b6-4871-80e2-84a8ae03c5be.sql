-- Update goals table for role-based assignments
ALTER TABLE goals 
  DROP CONSTRAINT IF EXISTS goals_category_check,
  ALTER COLUMN category TYPE text,
  ADD COLUMN coach_id uuid,
  ADD COLUMN lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN member_ids uuid[] DEFAULT '{}',
  ADD COLUMN created_by uuid,
  ADD COLUMN assignment_date timestamp with time zone;

-- Update category constraint to work/personal
ALTER TABLE goals 
  ADD CONSTRAINT goals_category_check CHECK (category IN ('work', 'personal'));

-- Create goal_assignments table
CREATE TABLE goal_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  assigned_by uuid NOT NULL,
  assigned_date timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false,
  self_assigned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for goal_assignments
ALTER TABLE goal_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goal_assignments
CREATE POLICY "Users can view their own goal assignments"
  ON goal_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all goal assignments"
  ON goal_assignments FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Managers can create goal assignments"
  ON goal_assignments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Users can create self-assignments as members"
  ON goal_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'member' AND self_assigned = true);

CREATE POLICY "Managers can update goal assignments"
  ON goal_assignments FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Users can acknowledge their assignments"
  ON goal_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- Create goal_notifications table
CREATE TABLE goal_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('assignment', 'self_assignment')),
  role text NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  acknowledged boolean NOT NULL DEFAULT false,
  created_date timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for goal_notifications
ALTER TABLE goal_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goal_notifications
CREATE POLICY "Users can view their own notifications"
  ON goal_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON goal_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON goal_notifications FOR UPDATE
  USING (auth.uid() = user_id);