-- First update ALL existing data to use new category values (case-insensitive)
UPDATE goals SET category = 'personal' WHERE LOWER(category) IN ('daily', 'weekly', 'monthly', 'custom');

-- Also update any other variations
UPDATE goals SET category = 'personal' WHERE category NOT IN ('work', 'personal');

-- Now proceed with the schema changes
ALTER TABLE goals 
  DROP CONSTRAINT IF EXISTS goals_category_check,
  ALTER COLUMN category TYPE text,
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone;

-- Update category constraint to work/personal
ALTER TABLE goals 
  ADD CONSTRAINT goals_category_check CHECK (category IN ('work', 'personal'));

-- Create goal_assignments table if not exists
CREATE TABLE IF NOT EXISTS goal_assignments (
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_assignments' AND policyname = 'Users can view their own goal assignments') THEN
    CREATE POLICY "Users can view their own goal assignments"
      ON goal_assignments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_assignments' AND policyname = 'Managers can view all goal assignments') THEN
    CREATE POLICY "Managers can view all goal assignments"
      ON goal_assignments FOR SELECT
      USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_assignments' AND policyname = 'Managers can create goal assignments') THEN
    CREATE POLICY "Managers can create goal assignments"
      ON goal_assignments FOR INSERT
      WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_assignments' AND policyname = 'Users can create self-assignments as members') THEN
    CREATE POLICY "Users can create self-assignments as members"
      ON goal_assignments FOR INSERT
      WITH CHECK (auth.uid() = user_id AND role = 'member' AND self_assigned = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_assignments' AND policyname = 'Managers can update goal assignments') THEN
    CREATE POLICY "Managers can update goal assignments"
      ON goal_assignments FOR UPDATE
      USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_assignments' AND policyname = 'Users can acknowledge their assignments') THEN
    CREATE POLICY "Users can acknowledge their assignments"
      ON goal_assignments FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create goal_notifications table if not exists
CREATE TABLE IF NOT EXISTS goal_notifications (
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications"
      ON goal_notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_notifications' AND policyname = 'System can create notifications') THEN
    CREATE POLICY "System can create notifications"
      ON goal_notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_notifications' AND policyname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications"
      ON goal_notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;