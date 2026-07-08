-- Source: 20250611002404-20e75612-7071-41bd-9598-44ec367d623d.sql

-- Allow users to view other users' basic profile information for tagging purposes
-- This policy allows all authenticated users to view basic profile data of other users
CREATE POLICY "Users can view other users for tagging" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- If the above policy is too permissive, you can use this more restrictive version instead:
-- CREATE POLICY "Users can view other users for tagging" 
-- ON public.profiles 
-- FOR SELECT 
-- TO authenticated
-- USING (user_status = 'active');


-- Source: 20250611014419-04434bc9-f1a4-446b-9379-27cb1452c08a.sql

-- Remove existing RLS policies that might be blocking team data access
DROP POLICY IF EXISTS "Users can only see their own data" ON public.profiles;
DROP POLICY IF EXISTS "Users can only see their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can only see their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can only see their own outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Users can only see their own mood" ON public.mood_entries;

-- Create new policies that allow all authenticated users to read all team data
CREATE POLICY "All authenticated users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "All authenticated users can view all habits" 
ON public.habits FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "All authenticated users can view all tasks" 
ON public.tasks FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "All authenticated users can view all weekly outputs" 
ON public.weekly_outputs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "All authenticated users can view all mood entries" 
ON public.mood_entries FOR SELECT 
TO authenticated 
USING (true);

-- Keep write policies restricted to own data
CREATE POLICY "Users can only modify their own profile" 
ON public.profiles FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only modify their own habits" 
ON public.habits FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only modify their own tasks" 
ON public.tasks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only modify their own weekly outputs" 
ON public.weekly_outputs FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only modify their own mood entries" 
ON public.mood_entries FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);


-- Source: 20250805105326_29422b7b-9c03-41f3-a541-90f46f646bcd.sql
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

-- Source: 20250816061609_233231d7-b2b6-4871-80e2-84a8ae03c5be.sql
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

-- Source: 20250816061819_7880d224-e816-45f9-8584-2887610f327f.sql
-- First update existing data to use new category values
UPDATE goals SET category = 'personal' WHERE category IN ('daily', 'weekly', 'monthly', 'custom');

-- Now proceed with the schema changes
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

-- Source: 20250816061903_1fbd7ee2-5585-449e-825b-db66f8cf15bd.sql
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

-- Source: 20250816061946_6b2c3c96-33d1-4b4c-a1f6-4b329e75522a.sql
-- First, let's check what values we have
SELECT DISTINCT category FROM goals;

-- Update ALL rows to use 'personal' for now (we can change specific ones later)
UPDATE goals SET category = 'personal';

-- Drop the existing constraint if it exists
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_category_check;

-- Now add the new columns
ALTER TABLE goals 
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone;

-- Now add the new constraint
ALTER TABLE goals 
  ADD CONSTRAINT goals_category_check CHECK (category IN ('work', 'personal'));

-- Source: 20250816062013_28a59b93-5360-44ff-a641-edaea28d39fa.sql
-- First create the new tables without touching goals table
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

ALTER TABLE goal_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS goal_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('assignment', 'self_assignment')),
  role text NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  acknowledged boolean NOT NULL DEFAULT false,
  created_date timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE goal_notifications ENABLE ROW LEVEL SECURITY;

-- Add the new columns to goals table
ALTER TABLE goals 
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone;

-- Update all existing goals to 'personal' category
UPDATE goals SET category = 'personal' WHERE category != 'personal' AND category != 'work';

-- Source: 20250816062045_52bc2972-caa0-42c0-aedb-c8fd3220ac17.sql
-- Drop the constraint completely first
ALTER TABLE goals DROP CONSTRAINT goals_category_check;

-- Now update the data
UPDATE goals SET category = 'personal';

-- Add new columns
ALTER TABLE goals 
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone;

-- Create new tables
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

ALTER TABLE goal_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS goal_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('assignment', 'self_assignment')),
  role text NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  acknowledged boolean NOT NULL DEFAULT false,
  created_date timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE goal_notifications ENABLE ROW LEVEL SECURITY;

-- Finally add the constraint back
ALTER TABLE goals 
  ADD CONSTRAINT goals_category_check CHECK (category IN ('work', 'personal'));

-- Source: 20250816062116_3c5df00f-c8f0-4262-b64d-2363575865a2.sql
-- Add RLS policies for goal_assignments
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

-- Add RLS policies for goal_notifications
CREATE POLICY "Users can view their own notifications"
  ON goal_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON goal_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON goal_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Source: 20250816073720_3ad52a4d-98b2-4047-8da2-a4b154ed3cb3.sql
-- Phase 1: Database Security - Fix RLS policies and add secure user filtering

-- First, drop the overly permissive policies that expose admin data
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other users for tagging" ON public.profiles;

-- Create a secure function to get filtered users based on requesting user's role
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  position text,
  user_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
    
  ELSE
    -- Team members can only see other team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
  END IF;
END;
$$;

-- Create new role-based RLS policies that are more restrictive
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Managers can view non-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'manager' 
  AND role IN ('team-member', 'manager')
);

CREATE POLICY "Team members can view non-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'team-member' 
  AND role IN ('team-member', 'manager')
  AND id != auth.uid()
);

-- Keep existing policies for other operations (insert, update, delete)
-- These are already properly restricted

-- Source: 20250816073803_ccd7590d-44f9-482b-bf4c-a013ff8ab1cf.sql
-- Phase 1: Database Security - Fix RLS policies and add secure user filtering

-- First, drop the overly permissive policies that expose admin data
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other users for tagging" ON public.profiles;

-- Create a secure function to get filtered users based on requesting user's role
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  user_position text,
  user_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
    
  ELSE
    -- Team members can only see other team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
  END IF;
END;
$$;

-- Create new role-based RLS policies that are more restrictive
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Managers can view non-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'manager' 
  AND role IN ('team-member', 'manager')
);

CREATE POLICY "Team members can view non-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'team-member' 
  AND role IN ('team-member', 'manager')
  AND id != auth.uid()
);

-- Source: 20250816073838_f31bdf60-5c4f-4d2e-8eb9-ee2a4c1d41a0.sql
-- Phase 1: Database Security - Fix RLS policies and add secure user filtering

-- Drop all existing broad policies that expose admin data
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other users for tagging" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view non-admin profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view non-admin profiles" ON public.profiles;

-- Create a secure function to get filtered users based on requesting user's role
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  user_position text,
  user_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
    
  ELSE
    -- Team members can only see other team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
  END IF;
END;
$$;

-- Create new restrictive RLS policies
CREATE POLICY "Secure: Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Secure: Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Secure: Managers can view non-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'manager' 
  AND role IN ('team-member', 'manager')
);

CREATE POLICY "Secure: Team members can view non-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'team-member' 
  AND role IN ('team-member', 'manager')
  AND id != auth.uid()
);

-- Source: 20250816073923_24319e83-d9e0-432c-93ef-0e3954edd75e.sql
-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  user_position text,
  user_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
    
  ELSE
    -- Team members can only see other team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
  END IF;
END;
$$;

-- Source: 20250816074522_4513ad8c-171f-4173-9640-25eea182eee1.sql
-- Update get_filtered_users_for_role function to include the requesting user
-- This allows goal creators to assign themselves to roles in their own goals
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users (including themselves)
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    -- Include themselves so they can assign themselves to goals
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
    
  ELSE
    -- Team members can see other team members and managers, but NOT admins
    -- Include themselves so they can assign themselves to goals
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
  END IF;
END;
$function$

-- Source: 20250816153037_f1ebea22-3649-40a6-8c0f-db2179691605.sql
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

-- Source: 20250816155837_c1f9e20c-e210-439c-809f-0ad6912d1c9d.sql
-- Add DELETE policy for users to delete their own goal assignments
CREATE POLICY "Users can delete their own goal assignments"
ON public.goal_assignments
FOR DELETE
USING (auth.uid() = user_id);

-- Clean up duplicate goal assignments (keep only the most recent one for each user/goal combination)
DELETE FROM goal_assignments a1
USING goal_assignments a2
WHERE a1.id < a2.id 
  AND a1.user_id = a2.user_id 
  AND a1.goal_id = a2.goal_id;

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE goal_assignments 
ADD CONSTRAINT unique_user_goal_assignment 
UNIQUE (user_id, goal_id);

-- Source: 20250816164309_1ed090cd-8232-41ae-bbe5-c24611c210c4.sql
-- Remove unused target_value and current_value columns from goals table
-- These fields are no longer needed since we're using a simplified progress system

ALTER TABLE public.goals 
DROP COLUMN IF EXISTS target_value,
DROP COLUMN IF EXISTS current_value;

-- Source: 20250816165313_e10820b8-d10c-4d2f-92b7-bd4b197a0967.sql
-- Add progress column to goals table to properly store progress values
-- This replaces the removed current_value column with a proper progress field

ALTER TABLE public.goals 
ADD COLUMN progress INTEGER DEFAULT 0 NOT NULL;

-- Add constraint to ensure progress is between 0 and 100
ALTER TABLE public.goals 
ADD CONSTRAINT goals_progress_check CHECK (progress >= 0 AND progress <= 100);

-- Update any existing goals to have 0% progress
UPDATE public.goals 
SET progress = 0 
WHERE progress IS NULL;

-- Source: 20250816172558_6c90b3ba-1315-4cf2-9d72-2d9e39da4bbe.sql
-- Drop the existing restrictive UPDATE policy for goals
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;

-- Create a new UPDATE policy that allows both owners and assigned users
CREATE POLICY "Users can update their own goals or assigned goals" 
ON public.goals 
FOR UPDATE 
USING (
  -- Allow if user owns the goal
  (auth.uid() = user_id) OR 
  -- Allow if user is assigned to the goal
  EXISTS (
    SELECT 1 FROM goal_assignments 
    WHERE goal_id = goals.id 
    AND user_id = auth.uid()
  )
);

-- Source: 20250816182015_af56f316-76cd-4531-bf71-a290489c6166.sql
-- Check current RLS policies on goals table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'goals' 
ORDER BY policyname;

-- Also check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'goals';

-- Source: 20250816182217_b31199f2-54d6-4422-8080-eaa38e1777d0.sql
-- Clean up conflicting RLS policies on goals table
-- First drop the redundant and potentially conflicting policies

-- Drop duplicate select policies that might be conflicting
DROP POLICY IF EXISTS "All authenticated users can view all goals" ON goals;
DROP POLICY IF EXISTS "Managers can access all team member goals" ON goals;
DROP POLICY IF EXISTS "Users can only modify their own goals" ON goals;

-- Keep the essential policies and ensure they work correctly
-- Policy for users to view their own goals (already exists: "Users can view their own goals")
-- Policy for users to create their own goals (already exists: "Users can create their own goals") 
-- Policy for users to update their own goals (already exists: "Users can update their own goals or assigned goals")
-- Policy for users to delete their own goals (already exists: "Users can delete their own goals")

-- Add a simple policy for managers and admins to view all goals
CREATE POLICY "Managers and admins can view all goals" ON goals
FOR SELECT USING (
  get_user_role(auth.uid()) IN ('manager', 'admin')
);

-- Add a policy for managers and admins to manage all goals
CREATE POLICY "Managers and admins can manage all goals" ON goals
FOR ALL USING (
  get_user_role(auth.uid()) IN ('manager', 'admin')
);

-- Ensure the existing admin policy is sufficient (already exists: "Admins can manage all goals")

-- Source: 20250817032446_55daaf75-b21a-4444-b2d7-2b2fbf6a2c12.sql
-- Allow users to view work goals for joining purposes
-- This enables team members to see work goals they can join
CREATE POLICY "Users can view work goals for joining"
ON public.goals
FOR SELECT
USING (
  category = 'work' 
  AND (
    -- Users can see work goals that they are not already members of
    auth.uid() != user_id OR auth.uid() = ANY(member_ids) OR auth.uid() = ANY(lead_ids) OR auth.uid() = coach_id
  )
);

-- Source: 20250817032510_ba6d520e-b831-402f-b18b-da62148327ac.sql
-- Drop the incorrect policy
DROP POLICY "Users can view work goals for joining" ON public.goals;

-- Create the correct policy that allows users to see work goals they can join
CREATE POLICY "Users can view work goals to join"
ON public.goals
FOR SELECT
USING (
  category = 'work' 
  AND progress < 100
  AND NOT archived
  AND NOT is_deleted
  AND NOT (
    -- Exclude goals where user is already involved as member, lead, or coach
    auth.uid() = ANY(member_ids) OR 
    auth.uid() = ANY(lead_ids) OR 
    auth.uid() = coach_id
  )
);

-- Source: 20250817033638_cb140d9e-d9e7-4e8a-885f-5e60dd94a47f.sql
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

-- Source: 20250818003143_8ec8e5a5-8844-442d-a02d-4f46aa1a024a.sql
-- Remove role restrictions on goal creation - allow all authenticated users to create work goals
-- Update existing RLS policy to allow all users to create any type of goal
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;

CREATE POLICY "All users can create goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure only goal creators can permanently delete goals (this should already be correct but let's be explicit)
-- The existing delete policy should already handle this correctly

-- Source: 20250818024021_4f5b3623-d267-4fa7-a4a2-ead63379eca9.sql
-- Drop the restrictive policy that only allows self-assignment as member
DROP POLICY "Users can create self-assignments as members" ON goal_assignments;

-- Create new policy allowing self-assignment to any role
CREATE POLICY "Users can create self-assignments to any role" 
ON goal_assignments FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND (self_assigned = true)
);

-- Source: 20250818031913_3c3f60d3-8955-4547-a395-ea219a5c9000.sql
-- Add new habit category enum values
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'mental';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'relationship';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'social';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'spiritual';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'wealth';

-- Source: 20250818034259_e559c16f-2412-452e-8ba9-de5a7db15f66.sql
-- Add subcategory column to goals table
ALTER TABLE public.goals 
ADD COLUMN subcategory TEXT;

-- Source: 20250818150840_2e100e4a-9337-4bd0-be58-7785e2fb1877.sql
-- Update goals with null created_by to use user_id as fallback
UPDATE goals 
SET created_by = user_id 
WHERE created_by IS NULL;

-- Source: 20250818151731_fb257bc4-ce7f-424a-8504-28e1d67ab59f.sql
-- Create function to link output to goal with proper permissions
CREATE OR REPLACE FUNCTION public.link_output_to_goal(
  output_id text,
  goal_id uuid,
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  goal_exists boolean;
  output_exists boolean;
  can_link boolean;
BEGIN
  -- Check if goal exists and user has access to it
  SELECT EXISTS(
    SELECT 1 FROM goals g
    WHERE g.id = goal_id
    AND (
      g.user_id = user_id_param OR
      EXISTS(SELECT 1 FROM goal_assignments ga WHERE ga.goal_id = g.id AND ga.user_id = user_id_param)
    )
    AND NOT g.is_deleted
    AND NOT g.archived
  ) INTO goal_exists;
  
  -- Check if weekly output exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM weekly_outputs wo
    WHERE wo.id::text = output_id
    AND wo.user_id = user_id_param
    AND NOT wo.is_deleted
  ) INTO output_exists;
  
  IF NOT goal_exists THEN
    RAISE EXCEPTION 'Goal not found or access denied';
  END IF;
  
  IF NOT output_exists THEN
    RAISE EXCEPTION 'Weekly output not found or access denied';
  END IF;
  
  -- Add goal_id to weekly output's linked_goal_ids if not already present
  UPDATE weekly_outputs
  SET linked_goal_ids = CASE
    WHEN goal_id::text = ANY(linked_goal_ids) THEN linked_goal_ids
    ELSE array_append(linked_goal_ids, goal_id::text)
  END
  WHERE id::text = output_id;
  
  -- Add output_id to goal's linked_output_ids if not already present
  UPDATE goals
  SET linked_output_ids = CASE
    WHEN output_id = ANY(linked_output_ids) THEN linked_output_ids
    ELSE array_append(linked_output_ids, output_id)
  END
  WHERE id = goal_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to unlink output from goal
CREATE OR REPLACE FUNCTION public.unlink_output_from_goal(
  output_id text,
  goal_id uuid,
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  goal_exists boolean;
  output_exists boolean;
BEGIN
  -- Check if goal exists and user has access to it
  SELECT EXISTS(
    SELECT 1 FROM goals g
    WHERE g.id = goal_id
    AND (
      g.user_id = user_id_param OR
      EXISTS(SELECT 1 FROM goal_assignments ga WHERE ga.goal_id = g.id AND ga.user_id = user_id_param)
    )
  ) INTO goal_exists;
  
  -- Check if weekly output exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM weekly_outputs wo
    WHERE wo.id::text = output_id
    AND wo.user_id = user_id_param
  ) INTO output_exists;
  
  IF NOT goal_exists THEN
    RAISE EXCEPTION 'Goal not found or access denied';
  END IF;
  
  IF NOT output_exists THEN
    RAISE EXCEPTION 'Weekly output not found or access denied';
  END IF;
  
  -- Remove goal_id from weekly output's linked_goal_ids
  UPDATE weekly_outputs
  SET linked_goal_ids = array_remove(linked_goal_ids, goal_id::text)
  WHERE id::text = output_id;
  
  -- Remove output_id from goal's linked_output_ids
  UPDATE goals
  SET linked_output_ids = array_remove(linked_output_ids, output_id)
  WHERE id = goal_id;
  
  RETURN TRUE;
END;
$$;

-- Source: 20250818225739_8f67fc40-9c45-4492-9421-5ddfeb5c8833.sql
-- Create item_linkages table for universal linking between any items
CREATE TABLE public.item_linkages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('goal', 'task', 'weekly_output', 'habit')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('goal', 'task', 'weekly_output', 'habit')),
  target_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- Enable RLS
ALTER TABLE public.item_linkages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_linkages
CREATE POLICY "Users can manage their own linkages"
ON public.item_linkages
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all linkages"
ON public.item_linkages
FOR SELECT
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create indexes for performance
CREATE INDEX idx_item_linkages_source ON public.item_linkages(source_type, source_id);
CREATE INDEX idx_item_linkages_target ON public.item_linkages(target_type, target_id);
CREATE INDEX idx_item_linkages_user_id ON public.item_linkages(user_id);

-- Migrate existing goal->output links from goals table
INSERT INTO public.item_linkages (user_id, source_type, source_id, target_type, target_id)
SELECT 
  g.user_id,
  'goal',
  g.id::text,
  'weekly_output',
  unnest(g.linked_output_ids)
FROM public.goals g
WHERE g.linked_output_ids IS NOT NULL AND array_length(g.linked_output_ids, 1) > 0;

-- Migrate existing output->goal links from weekly_outputs table
INSERT INTO public.item_linkages (user_id, source_type, source_id, target_type, target_id)
SELECT 
  wo.user_id,
  'weekly_output',
  wo.id::text,
  'goal',
  unnest(wo.linked_goal_ids)
FROM public.weekly_outputs wo
WHERE wo.linked_goal_ids IS NOT NULL AND array_length(wo.linked_goal_ids, 1) > 0
ON CONFLICT (source_type, source_id, target_type, target_id) DO NOTHING;

-- Remove the array columns that cause RLS conflicts
ALTER TABLE public.goals DROP COLUMN IF EXISTS linked_output_ids;
ALTER TABLE public.weekly_outputs DROP COLUMN IF EXISTS linked_goal_ids;

-- Create trigger for updating updated_at
CREATE TRIGGER update_item_linkages_updated_at
BEFORE UPDATE ON public.item_linkages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get linkages for an item
CREATE OR REPLACE FUNCTION public.get_item_linkages(
  p_item_type TEXT,
  p_item_id TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  target_type TEXT,
  target_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.target_type,
    il.target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.source_type = p_item_type 
    AND il.source_id = p_item_id
    AND il.user_id = p_user_id
  
  UNION
  
  SELECT 
    il.source_type as target_type,
    il.source_id as target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.target_type = p_item_type 
    AND il.target_id = p_item_id
    AND il.user_id = p_user_id;
END;
$$;

-- Source: 20250818231553_a3c24630-b8cf-4318-8dc2-dafa0798c04a.sql
-- Create function to cleanup stale linkages
CREATE OR REPLACE FUNCTION public.cleanup_stale_linkages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove linkages to deleted/archived goals
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'goal' AND EXISTS (
    SELECT 1 FROM goals g 
    WHERE g.id::text = il.source_id 
    AND (g.is_deleted = true OR g.archived = true)
  ))
  OR (il.target_type = 'goal' AND EXISTS (
    SELECT 1 FROM goals g 
    WHERE g.id::text = il.target_id 
    AND (g.is_deleted = true OR g.archived = true)
  ));

  -- Remove linkages to deleted weekly outputs
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'weekly_output' AND EXISTS (
    SELECT 1 FROM weekly_outputs wo 
    WHERE wo.id::text = il.source_id 
    AND wo.is_deleted = true
  ))
  OR (il.target_type = 'weekly_output' AND EXISTS (
    SELECT 1 FROM weekly_outputs wo 
    WHERE wo.id::text = il.target_id 
    AND wo.is_deleted = true
  ));

  -- Remove linkages to deleted tasks
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'task' AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id::text = il.source_id 
    AND t.is_deleted = true
  ))
  OR (il.target_type = 'task' AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id::text = il.target_id 
    AND t.is_deleted = true
  ));

  -- Remove linkages to deleted/archived habits
  DELETE FROM item_linkages il
  WHERE (il.source_type = 'habit' AND EXISTS (
    SELECT 1 FROM habits h 
    WHERE h.id::text = il.source_id 
    AND (h.is_deleted = true OR h.archived = true)
  ))
  OR (il.target_type = 'habit' AND EXISTS (
    SELECT 1 FROM habits h 
    WHERE h.id::text = il.target_id 
    AND (h.is_deleted = true OR h.archived = true)
  ));
END;
$$;

-- Update get_item_linkages function to filter out inactive items
CREATE OR REPLACE FUNCTION public.get_item_linkages(p_item_type text, p_item_id text, p_user_id uuid)
RETURNS TABLE(target_type text, target_id text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.target_type,
    il.target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.source_type = p_item_type 
    AND il.source_id = p_item_id
    AND il.user_id = p_user_id
    AND (
      -- Filter active goals
      (il.target_type = 'goal' AND EXISTS (
        SELECT 1 FROM goals g 
        WHERE g.id::text = il.target_id 
        AND g.is_deleted = false 
        AND g.archived = false
      ))
      OR
      -- Filter active weekly outputs
      (il.target_type = 'weekly_output' AND EXISTS (
        SELECT 1 FROM weekly_outputs wo 
        WHERE wo.id::text = il.target_id 
        AND wo.is_deleted = false
      ))
      OR
      -- Filter active tasks
      (il.target_type = 'task' AND EXISTS (
        SELECT 1 FROM tasks t 
        WHERE t.id::text = il.target_id 
        AND t.is_deleted = false
      ))
      OR
      -- Filter active habits
      (il.target_type = 'habit' AND EXISTS (
        SELECT 1 FROM habits h 
        WHERE h.id::text = il.target_id 
        AND h.is_deleted = false 
        AND h.archived = false
      ))
    )
  
  UNION
  
  SELECT 
    il.source_type as target_type,
    il.source_id as target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.target_type = p_item_type 
    AND il.target_id = p_item_id
    AND il.user_id = p_user_id
    AND (
      -- Filter active goals
      (il.source_type = 'goal' AND EXISTS (
        SELECT 1 FROM goals g 
        WHERE g.id::text = il.source_id 
        AND g.is_deleted = false 
        AND g.archived = false
      ))
      OR
      -- Filter active weekly outputs
      (il.source_type = 'weekly_output' AND EXISTS (
        SELECT 1 FROM weekly_outputs wo 
        WHERE wo.id::text = il.source_id 
        AND wo.is_deleted = false
      ))
      OR
      -- Filter active tasks
      (il.source_type = 'task' AND EXISTS (
        SELECT 1 FROM tasks t 
        WHERE t.id::text = il.source_id 
        AND t.is_deleted = false
      ))
      OR
      -- Filter active habits
      (il.source_type = 'habit' AND EXISTS (
        SELECT 1 FROM habits h 
        WHERE h.id::text = il.source_id 
        AND h.is_deleted = false 
        AND h.archived = false
      ))
    );
END;
$$;

-- Create trigger function to cleanup linkages on item deletion/archiving
CREATE OR REPLACE FUNCTION public.cleanup_item_linkages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For goals table
  IF TG_TABLE_NAME = 'goals' THEN
    IF NEW.is_deleted = true OR NEW.archived = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'goal' AND source_id = NEW.id::text) OR
        (target_type = 'goal' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  -- For weekly_outputs table
  IF TG_TABLE_NAME = 'weekly_outputs' THEN
    IF NEW.is_deleted = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'weekly_output' AND source_id = NEW.id::text) OR
        (target_type = 'weekly_output' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  -- For tasks table
  IF TG_TABLE_NAME = 'tasks' THEN
    IF NEW.is_deleted = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'task' AND source_id = NEW.id::text) OR
        (target_type = 'task' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  -- For habits table
  IF TG_TABLE_NAME = 'habits' THEN
    IF NEW.is_deleted = true OR NEW.archived = true THEN
      DELETE FROM item_linkages 
      WHERE user_id = NEW.user_id 
      AND (
        (source_type = 'habit' AND source_id = NEW.id::text) OR
        (target_type = 'habit' AND target_id = NEW.id::text)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for automatic cleanup
CREATE TRIGGER cleanup_goal_linkages_trigger
  AFTER UPDATE ON goals
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR OLD.archived IS DISTINCT FROM NEW.archived)
  EXECUTE FUNCTION cleanup_item_linkages();

CREATE TRIGGER cleanup_weekly_output_linkages_trigger
  AFTER UPDATE ON weekly_outputs
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION cleanup_item_linkages();

CREATE TRIGGER cleanup_task_linkages_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION cleanup_item_linkages();

CREATE TRIGGER cleanup_habit_linkages_trigger
  AFTER UPDATE ON habits
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR OLD.archived IS DISTINCT FROM NEW.archived)
  EXECUTE FUNCTION cleanup_item_linkages();

-- Clean up existing stale linkages
SELECT cleanup_stale_linkages();

-- Source: 20250819001643_ec0bd7c8-dc3b-4291-9a53-4272021eb49d.sql
-- Add linked_goal_ids column to weekly_outputs table
ALTER TABLE weekly_outputs 
ADD COLUMN linked_goal_ids TEXT[] DEFAULT '{}';

-- Add linked_output_ids column to goals table  
ALTER TABLE goals 
ADD COLUMN linked_output_ids TEXT[] DEFAULT '{}';

-- Source: 20250819005545_65a8e29a-8a85-400e-8aa9-1aab2cca1cd9.sql
-- Update RLS policies to allow all users to see all goals
-- Drop the restrictive team member policy for viewing joinable work goals
DROP POLICY IF EXISTS "Team members can view joinable work goals" ON goals;

-- Create a new policy that allows all authenticated users to view all active goals
CREATE POLICY "All users can view all active goals" 
ON goals 
FOR SELECT 
TO authenticated
USING (NOT is_deleted AND NOT archived);

-- Source: 20250821065832_347da18a-1f07-431a-a396-7002c13ef71d.sql
-- Add single linked_goal_id column to weekly_outputs table to match task->output architecture
ALTER TABLE weekly_outputs 
ADD COLUMN linked_goal_id UUID NULL;

-- Migrate existing array data to single column (take first goal if multiple exist)
UPDATE weekly_outputs 
SET linked_goal_id = (
  CASE 
    WHEN linked_goal_ids IS NOT NULL AND array_length(linked_goal_ids, 1) > 0 
    THEN linked_goal_ids[1]::UUID
    ELSE NULL
  END
)
WHERE linked_goal_ids IS NOT NULL;

-- Source: 20250821101415_131afdac-8687-473c-8e80-575deba657be.sql
-- Add linked_goal_id column to habits table for linking habits to personal goals
ALTER TABLE public.habits 
ADD COLUMN linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- Source: 20250822004315_2bc8dd6d-fcff-4825-9a9e-8112c71cc286.sql
-- Update get_habits_for_date function to include linked_goal_id
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
$function$

-- Source: 20250822004709_96732dcd-5b47-4694-9dda-5a9283d92d03.sql
-- Drop and recreate get_habits_for_date function to include linked_goal_id
DROP FUNCTION IF EXISTS public.get_habits_for_date(uuid, date);

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
$function$

-- Source: 20250822082351_ea5881ef-eefb-4252-b406-02e897289275.sql
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

-- Source: 20250822082418_7492603b-df05-40aa-83b9-97ce3e332ad1.sql
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

-- Source: 20250822082506_0de64b8d-1a60-4d8d-b054-564acd3980fc.sql
-- Drop and recreate the habit completion function with correct parameter names
DROP FUNCTION IF EXISTS public.toggle_habit_completion(uuid, uuid, date, boolean);

-- Recreate the function with the parameter names expected by the code
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

-- Source: 20250822083536_0b46d989-3be8-426e-84aa-f1e8007066df.sql
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

-- Source: 20250822085429_2d533e1e-2ccd-4506-b0ae-85e45e6d530d.sql
-- Phase 1: Add missing foreign key constraints to fix PostgREST join detection
ALTER TABLE goal_assignments 
ADD CONSTRAINT goal_assignments_goal_id_fkey 
FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;

ALTER TABLE goal_assignments 
ADD CONSTRAINT goal_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_goal_assignments_goal_id ON goal_assignments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_user_id ON goal_assignments(user_id);

-- Source: 20250822091818_3d7c6f5b-01ef-47e1-8e89-43159ea089f4.sql
-- Fix goal joining functionality by relaxing RLS policies for collaboration

-- Update goal_assignments policies to allow collaboration
DROP POLICY IF EXISTS "Users can insert assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.goal_assignments;

-- Allow authenticated users to create goal assignments for joining goals
CREATE POLICY "Authenticated users can create goal assignments" 
ON public.goal_assignments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to view assignments for goals they can see
CREATE POLICY "Users can view goal assignments for accessible goals" 
ON public.goal_assignments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.goals g 
    WHERE g.id = goal_assignments.goal_id 
    AND (NOT g.is_deleted AND NOT g.archived)
  )
);

-- Keep the existing update policy for users to acknowledge their assignments
-- Users can update their own assignments (keep existing)

-- Ensure goals are properly visible for collaboration
DROP POLICY IF EXISTS "All users can view all active goals" ON public.goals;

CREATE POLICY "Authenticated users can view active goals" 
ON public.goals 
FOR SELECT 
TO authenticated
USING (NOT is_deleted AND NOT archived);

-- Create a security definer function for safe goal assignment creation
CREATE OR REPLACE FUNCTION public.create_goal_assignment(
  p_goal_id uuid,
  p_user_id uuid,
  p_role text,
  p_assigned_by uuid,
  p_self_assigned boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the goal assignment
  INSERT INTO public.goal_assignments (
    goal_id,
    user_id,
    role,
    assigned_by,
    self_assigned,
    acknowledged
  ) VALUES (
    p_goal_id,
    p_user_id,
    p_role,
    p_assigned_by,
    p_self_assigned,
    false
  );
END;
$$;

-- Create a function to safely create goal notifications
CREATE OR REPLACE FUNCTION public.create_goal_notification(
  p_user_id uuid,
  p_goal_id uuid,
  p_notification_type text,
  p_role text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the goal notification
  INSERT INTO public.goal_notifications (
    user_id,
    goal_id,
    notification_type,
    role,
    acknowledged
  ) VALUES (
    p_user_id,
    p_goal_id,
    p_notification_type,
    p_role,
    false
  );
END;
$$;

-- Source: 20250822100516_334db820-f258-4699-8dda-ae9d4bab3370.sql
-- Migration to convert legacy goal member_ids/lead_ids/coach_id arrays to goal_assignments table
-- This will create proper goal_assignment records for existing relationships

-- Insert coach assignments from existing coach_id field
INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned, acknowledged)
SELECT 
  id as goal_id,
  coach_id as user_id,
  'coach' as role,
  user_id as assigned_by,
  false as self_assigned,
  true as acknowledged  -- Mark as acknowledged since these are existing relationships
FROM goals 
WHERE coach_id IS NOT NULL 
  AND NOT is_deleted 
  AND NOT archived;

-- Insert lead assignments from existing lead_ids array
INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned, acknowledged)
SELECT 
  g.id as goal_id,
  unnest(g.lead_ids) as user_id,
  'lead' as role,
  g.user_id as assigned_by,
  false as self_assigned,
  true as acknowledged  -- Mark as acknowledged since these are existing relationships
FROM goals g
WHERE array_length(g.lead_ids, 1) > 0 
  AND NOT g.is_deleted 
  AND NOT g.archived;

-- Insert member assignments from existing member_ids array
INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned, acknowledged)
SELECT 
  g.id as goal_id,
  unnest(g.member_ids) as user_id,
  'member' as role,
  g.user_id as assigned_by,
  false as self_assigned,
  true as acknowledged  -- Mark as acknowledged since these are existing relationships
FROM goals g
WHERE array_length(g.member_ids, 1) > 0 
  AND NOT g.is_deleted 
  AND NOT g.archived;

-- Clear the legacy arrays now that we have proper goal_assignments records
-- This ensures consistency and prevents confusion
UPDATE goals 
SET 
  member_ids = '{}',
  lead_ids = '{}',
  coach_id = NULL
WHERE NOT is_deleted AND NOT archived;

-- Source: 20250822101618_66e9cfcc-f808-477d-bdfe-e6df921f6fc9.sql
-- Phase 1: Clean up phantom assignments created during migration
-- Remove assignments that were automatically created from legacy member_ids but not actual user actions

-- Remove Farah's assignments to Rifki's goals
DELETE FROM goal_assignments 
WHERE user_id = '7f6d0f86-164a-4734-a72c-5dead3d01b3d' 
  AND assigned_by = 'bd2054ee-7ef3-4683-bd13-601a2a21ca1b'
  AND goal_id IN ('79f77383-188e-483d-ada1-60466fabe67c', 'b08f884b-cc19-4a37-85a6-d5eeae093571');

-- Remove Rifki's assignment to Farah's goal  
DELETE FROM goal_assignments 
WHERE user_id = 'bd2054ee-7ef3-4683-bd13-601a2a21ca1b' 
  AND assigned_by = '7f6d0f86-164a-4734-a72c-5dead3d01b3d'
  AND goal_id = '4e6103c7-c4fb-4b87-9a29-ea2d284102d6';

-- Source: 20250822104513_9e38829b-cac9-4129-8558-a469039308d5.sql
-- Enable real-time for goal-related tables
ALTER TABLE goals REPLICA IDENTITY FULL;
ALTER TABLE goal_assignments REPLICA IDENTITY FULL;
ALTER TABLE goal_notifications REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_notifications;

-- Clean up dual storage system - remove legacy role arrays since we're using goal_assignments
ALTER TABLE goals DROP COLUMN coach_id;
ALTER TABLE goals DROP COLUMN lead_ids;
ALTER TABLE goals DROP COLUMN member_ids;

-- Source: 20250822110906_c4606774-2386-4503-a8f1-ad693380f9ab.sql
-- Phase 1: Restore linked_goal_id column to weekly_outputs table
-- Add the linked_goal_id column that was removed during the incomplete migration
ALTER TABLE public.weekly_outputs 
ADD COLUMN IF NOT EXISTS linked_goal_id UUID REFERENCES public.goals(id);

-- Create index for better performance on linked goal queries
CREATE INDEX IF NOT EXISTS idx_weekly_outputs_linked_goal_id 
ON public.weekly_outputs(linked_goal_id);

-- Migrate any existing linkages from item_linkages table back to the column
-- This handles the case where some data might exist in item_linkages
UPDATE public.weekly_outputs
SET linked_goal_id = CAST(il.target_id AS UUID)
FROM public.item_linkages il
WHERE il.source_type = 'weekly_output' 
  AND il.target_type = 'goal'
  AND il.source_id = weekly_outputs.id::text
  AND weekly_outputs.linked_goal_id IS NULL;

-- Clean up the migrated linkages from item_linkages table for weekly_output -> goal
DELETE FROM public.item_linkages
WHERE (source_type = 'weekly_output' AND target_type = 'goal')
   OR (source_type = 'goal' AND target_type = 'weekly_output');

-- Update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_outputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_weekly_outputs_updated_at_trigger ON public.weekly_outputs;
CREATE TRIGGER update_weekly_outputs_updated_at_trigger
  BEFORE UPDATE ON public.weekly_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_outputs_updated_at();

-- Source: 20250822153247_df913599-e6e5-4d19-b0a0-9a31222595d8.sql
-- Drop the item_linkages table
DROP TABLE IF EXISTS public.item_linkages;

-- Drop the related database functions
DROP FUNCTION IF EXISTS public.get_item_linkages(text, text, uuid);
DROP FUNCTION IF EXISTS public.cleanup_stale_linkages();
DROP FUNCTION IF EXISTS public.link_output_to_goal(text, text, uuid);
DROP FUNCTION IF EXISTS public.unlink_output_from_goal(text, text, uuid);

-- Re-add direct foreign key columns that were removed
ALTER TABLE public.weekly_outputs 
ADD COLUMN IF NOT EXISTS linked_goal_ids uuid[];

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_weekly_outputs_linked_goal_ids ON public.weekly_outputs USING GIN(linked_goal_ids);

-- Add index for habits linked_goal_id if not exists
CREATE INDEX IF NOT EXISTS idx_habits_linked_goal_id ON public.habits(linked_goal_id);

-- Add index for tasks weekly_output_id if not exists  
CREATE INDEX IF NOT EXISTS idx_tasks_weekly_output_id ON public.tasks(weekly_output_id);

-- Source: 20250822154529_07048862-7c5f-48ea-b5e9-8ccd3ffeae07.sql
-- Remove the linked_goal_ids array column to standardize on single goal linking
ALTER TABLE public.weekly_outputs DROP COLUMN IF EXISTS linked_goal_ids;

-- Add index on linked_goal_id for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_outputs_linked_goal_id ON public.weekly_outputs(linked_goal_id);

-- Source: 20250822163010_ac0aee80-6407-4e45-99c9-bc510b1e17a1.sql
-- Add UPDATE policy for users to update their own goals
CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Source: 20250822165708_eb5c6411-04c6-4c07-bb71-36697c3fe470.sql
-- Fix RLS policies for goal_assignments to prevent cross-table reference issues

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view goal assignments for accessible goals" ON public.goal_assignments;

-- Create a more direct policy that allows users to see assignments for goals they can access
CREATE POLICY "Users can view assignments for their accessible goals" 
ON public.goal_assignments 
FOR SELECT 
USING (
  -- Users can see assignments for goals they own
  EXISTS (
    SELECT 1 FROM public.goals g 
    WHERE g.id = goal_assignments.goal_id 
    AND g.user_id = auth.uid() 
    AND NOT g.is_deleted
  )
  OR
  -- Users can see assignments for goals they are assigned to
  goal_assignments.user_id = auth.uid()
  OR
  -- Managers and admins can see all assignments
  get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

-- Also ensure users can delete their own assignments
DROP POLICY IF EXISTS "Users can delete their own assignments" ON public.goal_assignments;
CREATE POLICY "Users can delete assignments they control" 
ON public.goal_assignments 
FOR DELETE 
USING (
  -- Users can delete their own assignments
  auth.uid() = user_id 
  OR 
  -- Users can delete assignments they made
  auth.uid() = assigned_by
  OR
  -- Managers and admins can delete any assignments
  get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

-- Source: 20250825083041_175c96df-d413-4e6c-8d4f-9c3a671540e9.sql
-- Create pomodoro_sessions table for tracking completed sessions
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interrupted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own pomodoro sessions" 
ON public.pomodoro_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create their own pomodoro sessions" 
ON public.pomodoro_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Managers can view all sessions
CREATE POLICY "Managers can view all pomodoro sessions" 
ON public.pomodoro_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Add index for performance
CREATE INDEX idx_pomodoro_sessions_user_task ON public.pomodoro_sessions(user_id, task_id);
CREATE INDEX idx_pomodoro_sessions_completed_at ON public.pomodoro_sessions(completed_at DESC);

-- Source: 20250910001406_3c536996-4571-4b0f-844f-4c05826a22f3.sql
-- Remove the conflicting self-registration INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Remove duplicate UPDATE policies, keeping only the comprehensive ones
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only modify their own profile" ON public.profiles;

-- Remove overlapping SELECT policies to simplify the structure
DROP POLICY IF EXISTS "Managers can view team member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;

-- Create a clean, consolidated set of policies for profiles
-- Admins can do everything (already exists via "Admins can manage all profiles")

-- Users can update their own profile (consolidated policy)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Managers and team members can view appropriate profiles (replaces multiple overlapping policies)
CREATE POLICY "Role-based profile viewing" 
ON public.profiles 
FOR SELECT 
USING (
  -- Admins can see all (handled by separate admin policy)
  -- Users can see their own profile
  (auth.uid() = id) 
  OR 
  -- Managers can see team-member and manager profiles (not admin profiles)
  (get_user_role(auth.uid()) = 'manager' AND role IN ('team-member', 'manager'))
  OR
  -- Team members can see other team-member and manager profiles (not admin profiles, not themselves)
  (get_user_role(auth.uid()) = 'team-member' AND role IN ('team-member', 'manager') AND id != auth.uid())
);

-- Source: 20250910002250_640fc2ca-7c52-4076-bd4f-3c8db73a08b1.sql
-- Update the get_filtered_users_for_role function to include pending users
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users (including themselves) - both active and pending
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status IN ('active', 'pending')
    ORDER BY p.user_status DESC, p.name; -- Show pending first, then active
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins - both active and pending
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status IN ('active', 'pending')
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.user_status DESC, p.name;
    
  ELSE
    -- Team members can see other team members and managers, but NOT admins - both active and pending
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status IN ('active', 'pending')
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.user_status DESC, p.name;
  END IF;
END;
$function$

-- Source: 20250910002851_9102e1b6-ee5a-48f2-9e52-36de36929f88.sql
-- Revert get_filtered_users_for_role to only show active users
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role (ONLY ACTIVE USERS)
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all active users (including themselves)
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see active team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
    
  ELSE
    -- Team members can see other active team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
  END IF;
END;
$function$

-- Create new function specifically for admin user management (includes pending users)
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone, temporary_password text, has_changed_password boolean, last_login timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Only admins can use this function
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can view all users';
  END IF;
  
  -- Return all users (both active and pending) for admin management
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at, p.temporary_password, p.has_changed_password, p.last_login
  FROM public.profiles p
  WHERE p.user_status IN ('active', 'pending')
  ORDER BY p.user_status DESC, p.name; -- Show pending first, then active
END;
$function$

-- Source: 20250910003218_69a9c659-905c-4b0d-a983-0f34d0d74c64.sql
-- Revert get_filtered_users_for_role to only show active users
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role (ONLY ACTIVE USERS)
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all active users (including themselves)
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see active team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
    
  ELSE
    -- Team members can see other active team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
  END IF;
END;
$function$;

-- Source: 20250910003403_4def4155-3a42-42a9-8c10-18dd5ea1de73.sql
-- Create new function specifically for admin user management (includes pending users)
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone, temporary_password text, has_changed_password boolean, last_login timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Only admins can use this function
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can view all users';
  END IF;
  
  -- Return all users (both active and pending) for admin management
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at, p.temporary_password, p.has_changed_password, p.last_login
  FROM public.profiles p
  WHERE p.user_status IN ('active', 'pending')
  ORDER BY p.user_status DESC, p.name; -- Show pending first, then active
END;
$function$;

-- Source: 20250910004148_1f00fc27-c2a8-4977-b936-5682912d9e4b.sql
-- RLS Policy Cleanup Migration
-- Remove redundant and overlapping policies, standardize patterns

-- ============================================
-- HABITS TABLE CLEANUP
-- ============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can only modify their own habits" ON public.habits;
DROP POLICY IF EXISTS "Managers can access all team member habits" ON public.habits;

-- Update the remaining policies to be more consistent
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits" ON public.habits
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can access all team member habits" ON public.habits;
CREATE POLICY "Managers and admins can view all habits" ON public.habits
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- ============================================
-- MOOD_ENTRIES TABLE CLEANUP
-- ============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can only modify their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Managers can access all team member mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can view their own mood entries" ON public.mood_entries;

-- Keep the "All authenticated users can view all mood entries" as it's the intended behavior
-- Update manager policy to be consistent
CREATE POLICY "Managers and admins can view all mood entries" ON public.mood_entries
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- ============================================
-- TASKS TABLE CLEANUP
-- ============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can only modify their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can access all team member tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;

-- Keep "All authenticated users can view all tasks" as intended behavior
-- Update manager policy to be consistent
CREATE POLICY "Managers and admins can view all tasks" ON public.tasks
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- ============================================
-- WEEKLY_OUTPUTS TABLE CLEANUP
-- ============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can only modify their own weekly outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Managers can access all team member weekly outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Users can view their own weekly outputs" ON public.weekly_outputs;

-- Keep "All authenticated users can view all weekly outputs" as intended behavior
-- Update manager policy to be consistent
CREATE POLICY "Managers and admins can view all weekly outputs" ON public.weekly_outputs
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- ============================================
-- GOALS TABLE CLEANUP
-- ============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Managers and admins can manage all goals" ON public.goals;
DROP POLICY IF EXISTS "Managers and admins can view all goals" ON public.goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;

-- Keep "Authenticated users can view active goals" as intended behavior
-- Update manager policy to be consistent
CREATE POLICY "Managers and admins can view all goals" ON public.goals
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- ============================================
-- PROFILES TABLE CLEANUP
-- ============================================

-- Drop all the redundant "Secure:" policies
DROP POLICY IF EXISTS "Secure: Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Secure: Managers can view non-admin profiles" ON public.profiles;
DROP POLICY IF EXISTS "Secure: Team members can view non-admin profiles" ON public.profiles;
DROP POLICY IF EXISTS "Secure: Users can view their own profile" ON public.profiles;

-- Keep only the comprehensive "Role-based profile viewing" policy
-- And the admin management policy

-- ============================================
-- POMODORO_SESSIONS TABLE - ADD MISSING POLICIES
-- ============================================

-- Add missing UPDATE policy for users to modify their own sessions
CREATE POLICY "Users can update their own pomodoro sessions" ON public.pomodoro_sessions
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for users to delete their own sessions
CREATE POLICY "Users can delete their own pomodoro sessions" ON public.pomodoro_sessions
FOR DELETE USING (auth.uid() = user_id);

-- Add manager/admin access for pomodoro sessions
CREATE POLICY "Managers and admins can manage all pomodoro sessions" ON public.pomodoro_sessions
FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Source: 20250910004457_673995ab-8187-4d49-890b-64261c8b2e6c.sql
-- Fix function search path security issues
-- Add SET search_path = 'public' to functions that are missing it

-- Fix get_habits_for_date function
CREATE OR REPLACE FUNCTION public.get_habits_for_date(user_id_param uuid, target_date date)
 RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

-- Fix toggle_habit_completion function
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF is_completed THEN
    -- Insert completion record if it doesn't exist
    INSERT INTO habit_completions (habit_id, user_id, completed_date)
    VALUES (habit_id_param, user_id_param, target_date)
    ON CONFLICT (habit_id, completed_date) DO NOTHING;
    
    -- Update habit's last_completed_date and streak
    UPDATE habits 
    SET last_completed_date = target_date,
        streak = CASE 
          WHEN last_completed_date = target_date - INTERVAL '1 day' THEN streak + 1
          WHEN last_completed_date IS NULL OR last_completed_date < target_date - INTERVAL '1 day' THEN 1
          ELSE streak
        END
    WHERE id = habit_id_param AND user_id = user_id_param;
  ELSE
    -- Remove completion record
    DELETE FROM habit_completions 
    WHERE habit_id = habit_id_param AND completed_date = target_date AND user_id = user_id_param;
    
    -- Recalculate streak (simplified - just reset to 0 for now)
    UPDATE habits 
    SET streak = 0,
        last_completed_date = NULL
    WHERE id = habit_id_param AND user_id = user_id_param;
  END IF;
END;
$function$;

-- Fix update_weekly_outputs_updated_at function
CREATE OR REPLACE FUNCTION public.update_weekly_outputs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    'team-member'
  );
  RETURN new;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Password must be at least 8 characters
  IF LENGTH(password) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one number
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Source: 20250910015114_caa209ef-b0bd-4482-a448-ffa4dfee9a8e.sql
-- Add session_id to pomodoro_sessions table to group related work/break sessions
ALTER TABLE public.pomodoro_sessions 
ADD COLUMN session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN session_status TEXT DEFAULT 'completed' CHECK (session_status IN ('active', 'paused', 'stopped', 'completed')),
ADD COLUMN pomodoro_number INTEGER DEFAULT 1,
ADD COLUMN break_number INTEGER DEFAULT 0;

-- Create index for better querying by session_id
CREATE INDEX idx_pomodoro_sessions_session_id ON public.pomodoro_sessions(session_id);
CREATE INDEX idx_pomodoro_sessions_user_task ON public.pomodoro_sessions(user_id, task_id);

-- Create table for active pomodoro sessions to track current state
CREATE TABLE public.active_pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID,
  session_id UUID NOT NULL,
  task_title TEXT,
  session_status TEXT NOT NULL CHECK (session_status IN ('active-stopped', 'active-running', 'active-paused', 'terminated')) DEFAULT 'active-stopped',
  current_session_type TEXT NOT NULL CHECK (current_session_type IN ('work', 'short_break', 'long_break')) DEFAULT 'work',
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  sessions_until_long_break INTEGER NOT NULL DEFAULT 4,
  completed_work_sessions INTEGER NOT NULL DEFAULT 0,
  completed_break_sessions INTEGER NOT NULL DEFAULT 0,
  current_start_time TIMESTAMP WITH TIME ZONE,
  current_pause_time TIMESTAMP WITH TIME ZONE,
  current_time_remaining INTEGER, -- in seconds
  is_card_visible BOOLEAN NOT NULL DEFAULT true,
  is_floating_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for active_pomodoro_sessions
ALTER TABLE public.active_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for active_pomodoro_sessions
CREATE POLICY "Users can manage their own active sessions" 
ON public.active_pomodoro_sessions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all active sessions" 
ON public.active_pomodoro_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_active_pomodoro_sessions_updated_at
BEFORE UPDATE ON public.active_pomodoro_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20250910015150_a1af8410-73d5-433c-9725-019986c549b4.sql
-- Add session_id to pomodoro_sessions table to group related work/break sessions
ALTER TABLE public.pomodoro_sessions 
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'completed' CHECK (session_status IN ('active', 'paused', 'stopped', 'completed')),
ADD COLUMN IF NOT EXISTS pomodoro_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS break_number INTEGER DEFAULT 0;

-- Create index for better querying by session_id (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session_id ON public.pomodoro_sessions(session_id);

-- Create table for active pomodoro sessions to track current state
CREATE TABLE IF NOT EXISTS public.active_pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID,
  session_id UUID NOT NULL,
  task_title TEXT,
  session_status TEXT NOT NULL CHECK (session_status IN ('active-stopped', 'active-running', 'active-paused', 'terminated')) DEFAULT 'active-stopped',
  current_session_type TEXT NOT NULL CHECK (current_session_type IN ('work', 'short_break', 'long_break')) DEFAULT 'work',
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  sessions_until_long_break INTEGER NOT NULL DEFAULT 4,
  completed_work_sessions INTEGER NOT NULL DEFAULT 0,
  completed_break_sessions INTEGER NOT NULL DEFAULT 0,
  current_start_time TIMESTAMP WITH TIME ZONE,
  current_pause_time TIMESTAMP WITH TIME ZONE,
  current_time_remaining INTEGER, -- in seconds
  is_card_visible BOOLEAN NOT NULL DEFAULT true,
  is_floating_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for active_pomodoro_sessions if table was created
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'active_pomodoro_sessions' AND schemaname = 'public') THEN
        ALTER TABLE public.active_pomodoro_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for active_pomodoro_sessions (drop first if they exist)
DROP POLICY IF EXISTS "Users can manage their own active sessions" ON public.active_pomodoro_sessions;
DROP POLICY IF EXISTS "Managers can view all active sessions" ON public.active_pomodoro_sessions;

CREATE POLICY "Users can manage their own active sessions" 
ON public.active_pomodoro_sessions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all active sessions" 
ON public.active_pomodoro_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create trigger for automatic timestamp updates (drop first if exists)
DROP TRIGGER IF EXISTS update_active_pomodoro_sessions_updated_at ON public.active_pomodoro_sessions;

CREATE TRIGGER update_active_pomodoro_sessions_updated_at
BEFORE UPDATE ON public.active_pomodoro_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20250910045739_65965373-d325-46e8-b268-f83849083557.sql
-- Enable real-time for active_pomodoro_sessions table
ALTER TABLE public.active_pomodoro_sessions REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_pomodoro_sessions;

-- Source: 20250910114933_8a96fedf-cc4c-4735-970f-409bab5b3e2f.sql
-- Clean up duplicate pomodoro sessions that may have been created
-- Keep only the earliest session for each unique combination of task_id, pomodoro_number, and session_type
DELETE FROM pomodoro_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (task_id, pomodoro_number, session_type) id
  FROM pomodoro_sessions 
  ORDER BY task_id, pomodoro_number, session_type, created_at ASC
);

-- Source: 20250910213058_9f0964a9-7ab1-4a20-b6ee-48309fc40eb5.sql
-- Fix existing pomodoro sessions that completed naturally but are missing interrupted field
-- Set interrupted = false for sessions that completed with session_status = 'completed' and interrupted is null
UPDATE pomodoro_sessions 
SET interrupted = false 
WHERE session_status = 'completed' 
AND interrupted IS NULL;

-- Ensure future sessions have proper default
ALTER TABLE pomodoro_sessions 
ALTER COLUMN interrupted SET DEFAULT false;

-- Source: 20250910222740_a8a636c6-c515-4965-b2e3-3d664f9d40f3.sql
-- Create task_pomodoro_stats table for O(1) counter queries
CREATE TABLE public.task_pomodoro_stats (
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  work_sessions_count INTEGER NOT NULL DEFAULT 0,
  work_duration_total INTEGER NOT NULL DEFAULT 0, -- in minutes
  break_sessions_count INTEGER NOT NULL DEFAULT 0,
  break_duration_total INTEGER NOT NULL DEFAULT 0, -- in minutes
  last_work_session_at TIMESTAMP WITH TIME ZONE,
  last_break_session_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own task stats" 
ON public.task_pomodoro_stats 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all task stats" 
ON public.task_pomodoro_stats 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create indexes for performance
CREATE INDEX idx_task_pomodoro_stats_task_id ON public.task_pomodoro_stats(task_id);
CREATE INDEX idx_task_pomodoro_stats_user_id ON public.task_pomodoro_stats(user_id);
CREATE INDEX idx_task_pomodoro_stats_updated_at ON public.task_pomodoro_stats(updated_at);

-- Function to update task pomodoro stats
CREATE OR REPLACE FUNCTION public.update_task_pomodoro_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new session completed)
  IF TG_OP = 'INSERT' THEN
    -- Only count completed, non-interrupted sessions
    IF NEW.session_status = 'completed' AND NEW.interrupted = false THEN
      -- Upsert stats record
      INSERT INTO public.task_pomodoro_stats (
        task_id, 
        user_id, 
        work_sessions_count,
        work_duration_total,
        break_sessions_count,
        break_duration_total,
        last_work_session_at,
        last_break_session_at,
        updated_at
      ) VALUES (
        COALESCE(NEW.task_id, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.user_id,
        CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.completed_at ELSE NULL END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at ELSE NULL END,
        NOW()
      )
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET
        work_sessions_count = task_pomodoro_stats.work_sessions_count + 
          CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        work_duration_total = task_pomodoro_stats.work_duration_total + 
          CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        break_sessions_count = task_pomodoro_stats.break_sessions_count + 
          CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        break_duration_total = task_pomodoro_stats.break_duration_total + 
          CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        last_work_session_at = CASE 
          WHEN NEW.session_type = 'work' THEN NEW.completed_at 
          ELSE task_pomodoro_stats.last_work_session_at 
        END,
        last_break_session_at = CASE 
          WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at 
          ELSE task_pomodoro_stats.last_break_session_at 
        END,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE (session status changed)
  IF TG_OP = 'UPDATE' THEN
    -- If session was marked as interrupted or status changed, recalculate
    IF (OLD.interrupted != NEW.interrupted) OR (OLD.session_status != NEW.session_status) THEN
      -- For simplicity, we'll recalculate the entire stats for this task/user
      -- This ensures accuracy even if sessions are modified after creation
      
      IF NEW.task_id IS NOT NULL THEN
        -- Recalculate from scratch
        INSERT INTO public.task_pomodoro_stats (
          task_id, 
          user_id, 
          work_sessions_count,
          work_duration_total,
          break_sessions_count,
          break_duration_total,
          last_work_session_at,
          last_break_session_at,
          updated_at
        )
        SELECT 
          NEW.task_id,
          NEW.user_id,
          COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false), 0),
          COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false), 0),
          MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
          MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
          NOW()
        FROM public.pomodoro_sessions 
        WHERE task_id = NEW.task_id AND user_id = NEW.user_id
        ON CONFLICT (task_id, user_id) 
        DO UPDATE SET
          work_sessions_count = EXCLUDED.work_sessions_count,
          work_duration_total = EXCLUDED.work_duration_total,
          break_sessions_count = EXCLUDED.break_sessions_count,
          break_duration_total = EXCLUDED.break_duration_total,
          last_work_session_at = EXCLUDED.last_work_session_at,
          last_break_session_at = EXCLUDED.last_break_session_at,
          updated_at = NOW();
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE (session removed)
  IF TG_OP = 'DELETE' THEN
    IF OLD.task_id IS NOT NULL THEN
      -- Recalculate stats after deletion
      INSERT INTO public.task_pomodoro_stats (
        task_id, 
        user_id, 
        work_sessions_count,
        work_duration_total,
        break_sessions_count,
        break_duration_total,
        last_work_session_at,
        last_break_session_at,
        updated_at
      )
      SELECT 
        OLD.task_id,
        OLD.user_id,
        COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false), 0),
        COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false), 0),
        MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false),
        MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false),
        NOW()
      FROM public.pomodoro_sessions 
      WHERE task_id = OLD.task_id AND user_id = OLD.user_id
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET
        work_sessions_count = EXCLUDED.work_sessions_count,
        work_duration_total = EXCLUDED.work_duration_total,
        break_sessions_count = EXCLUDED.break_sessions_count,
        break_duration_total = EXCLUDED.break_duration_total,
        last_work_session_at = EXCLUDED.last_work_session_at,
        last_break_session_at = EXCLUDED.last_break_session_at,
        updated_at = NOW();
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on pomodoro_sessions
CREATE TRIGGER update_task_pomodoro_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pomodoro_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_task_pomodoro_stats();

-- Migrate existing data
INSERT INTO public.task_pomodoro_stats (
  task_id, 
  user_id, 
  work_sessions_count,
  work_duration_total,
  break_sessions_count,
  break_duration_total,
  last_work_session_at,
  last_break_session_at,
  updated_at
)
SELECT 
  COALESCE(task_id, '00000000-0000-0000-0000-000000000000'::uuid) as task_id,
  user_id,
  COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false) as work_sessions_count,
  COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false), 0) as work_duration_total,
  COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false) as break_sessions_count,
  COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false), 0) as break_duration_total,
  MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed' AND interrupted = false) as last_work_session_at,
  MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed' AND interrupted = false) as last_break_session_at,
  NOW() as updated_at
FROM public.pomodoro_sessions 
WHERE session_status = 'completed' AND interrupted = false
GROUP BY COALESCE(task_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id
HAVING COUNT(*) > 0;

-- Enable realtime for the new table
ALTER TABLE public.task_pomodoro_stats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_pomodoro_stats;

-- Source: 20250910224849_b59894fd-ec67-412c-b522-6f9031c098cc.sql
-- Add unique constraints to prevent duplicate pomodoro sessions
-- This prevents the same session from being saved multiple times

-- Add unique constraint on pomodoro_sessions to prevent duplicates
ALTER TABLE public.pomodoro_sessions 
ADD CONSTRAINT unique_session_completion 
UNIQUE (session_id, session_type, pomodoro_number, break_number);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session_id_type ON public.pomodoro_sessions (session_id, session_type);

-- Add index for task-based queries
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_user ON public.pomodoro_sessions (task_id, user_id) WHERE task_id IS NOT NULL;

-- Source: 20250910224917_50ac555e-fdb9-4adc-984c-e30e61ddb316.sql
-- Clean up duplicate pomodoro sessions before adding constraints
-- Keep only the latest record for each unique combination

WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY session_id, session_type, pomodoro_number, break_number 
           ORDER BY created_at DESC, completed_at DESC NULLS LAST
         ) as rn
  FROM public.pomodoro_sessions
)
DELETE FROM public.pomodoro_sessions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.pomodoro_sessions 
ADD CONSTRAINT unique_session_completion 
UNIQUE (session_id, session_type, pomodoro_number, break_number);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session_id_type ON public.pomodoro_sessions (session_id, session_type);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_user ON public.pomodoro_sessions (task_id, user_id) WHERE task_id IS NOT NULL;

-- Source: 20250910230856_7d476241-5193-45bb-a9bd-b5ce4b43e84a.sql
-- Step 1: Add new session status types for clear distinction
-- Update existing session_status to support new values
-- Note: We can't use ALTER TYPE to add enum values in a transaction, so we'll use text with constraints

-- First, drop the existing constraint if it exists
ALTER TABLE public.pomodoro_sessions 
DROP CONSTRAINT IF EXISTS pomodoro_sessions_session_status_check;

-- Add new check constraint with all status types
ALTER TABLE public.pomodoro_sessions 
ADD CONSTRAINT pomodoro_sessions_session_status_check 
CHECK (session_status IN ('completed', 'stopped', 'skipped', 'terminated'));

-- Update database function to only count truly completed sessions (not stopped/skipped)
CREATE OR REPLACE FUNCTION public.update_task_pomodoro_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle INSERT (new session completed)
  IF TG_OP = 'INSERT' THEN
    -- Only count sessions with status 'completed' (timer reached 00:00)
    -- Exclude 'stopped', 'skipped', and 'terminated' sessions
    IF NEW.session_status = 'completed' THEN
      -- Upsert stats record
      INSERT INTO public.task_pomodoro_stats (
        task_id, 
        user_id, 
        work_sessions_count,
        work_duration_total,
        break_sessions_count,
        break_duration_total,
        last_work_session_at,
        last_break_session_at,
        updated_at
      ) VALUES (
        COALESCE(NEW.task_id, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.user_id,
        CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.completed_at ELSE NULL END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at ELSE NULL END,
        NOW()
      )
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET
        work_sessions_count = task_pomodoro_stats.work_sessions_count + 
          CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        work_duration_total = task_pomodoro_stats.work_duration_total + 
          CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        break_sessions_count = task_pomodoro_stats.break_sessions_count + 
          CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        break_duration_total = task_pomodoro_stats.break_duration_total + 
          CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        last_work_session_at = CASE 
          WHEN NEW.session_type = 'work' THEN NEW.completed_at 
          ELSE task_pomodoro_stats.last_work_session_at 
        END,
        last_break_session_at = CASE 
          WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at 
          ELSE task_pomodoro_stats.last_break_session_at 
        END,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE (session status changed)
  IF TG_OP = 'UPDATE' THEN
    -- If session status changed, recalculate stats
    IF OLD.session_status != NEW.session_status THEN
      -- Recalculate from scratch for this task/user
      IF NEW.task_id IS NOT NULL THEN
        INSERT INTO public.task_pomodoro_stats (
          task_id, 
          user_id, 
          work_sessions_count,
          work_duration_total,
          break_sessions_count,
          break_duration_total,
          last_work_session_at,
          last_break_session_at,
          updated_at
        )
        SELECT 
          NEW.task_id,
          NEW.user_id,
          COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed'), 0),
          COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
          COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'), 0),
          MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
          MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
          NOW()
        FROM public.pomodoro_sessions 
        WHERE task_id = NEW.task_id AND user_id = NEW.user_id
        ON CONFLICT (task_id, user_id) 
        DO UPDATE SET
          work_sessions_count = EXCLUDED.work_sessions_count,
          work_duration_total = EXCLUDED.work_duration_total,
          break_sessions_count = EXCLUDED.break_sessions_count,
          break_duration_total = EXCLUDED.break_duration_total,
          last_work_session_at = EXCLUDED.last_work_session_at,
          last_break_session_at = EXCLUDED.last_break_session_at,
          updated_at = NOW();
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE (session removed)
  IF TG_OP = 'DELETE' THEN
    IF OLD.task_id IS NOT NULL THEN
      -- Recalculate stats after deletion
      INSERT INTO public.task_pomodoro_stats (
        task_id, 
        user_id, 
        work_sessions_count,
        work_duration_total,
        break_sessions_count,
        break_duration_total,
        last_work_session_at,
        last_break_session_at,
        updated_at
      )
      SELECT 
        OLD.task_id,
        OLD.user_id,
        COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed'), 0),
        COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
        COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'), 0),
        MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
        MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
        NOW()
      FROM public.pomodoro_sessions 
      WHERE task_id = OLD.task_id AND user_id = OLD.user_id
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET
        work_sessions_count = EXCLUDED.work_sessions_count,
        work_duration_total = EXCLUDED.work_duration_total,
        break_sessions_count = EXCLUDED.break_sessions_count,
        break_duration_total = EXCLUDED.break_duration_total,
        last_work_session_at = EXCLUDED.last_work_session_at,
        last_break_session_at = EXCLUDED.last_break_session_at,
        updated_at = NOW();
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

-- Source: 20250910231152_613cbc98-eef0-4e66-82f3-372a32629f23.sql
-- Final cleanup: Update existing sessions to use proper status values
-- Convert old interrupted sessions to proper status types

-- Update interrupted work/break sessions to 'stopped' status  
UPDATE public.pomodoro_sessions 
SET session_status = 'stopped'
WHERE interrupted = true 
  AND session_status = 'completed';

-- Ensure all non-interrupted sessions are marked as 'completed'
UPDATE public.pomodoro_sessions 
SET session_status = 'completed'
WHERE interrupted = false 
  AND session_status != 'completed';

-- Recalculate all task pomodoro stats to ensure accuracy after status changes
-- This will rebuild all stats based on the new session_status = 'completed' logic
DELETE FROM public.task_pomodoro_stats;

-- Trigger will automatically rebuild stats as we insert sessions
-- Insert a dummy session to trigger recalculation for all users/tasks
DO $$
DECLARE
    task_user_combo RECORD;
BEGIN
    FOR task_user_combo IN 
        SELECT DISTINCT task_id, user_id 
        FROM public.pomodoro_sessions 
        WHERE task_id IS NOT NULL
    LOOP
        INSERT INTO public.task_pomodoro_stats (
            task_id, 
            user_id, 
            work_sessions_count,
            work_duration_total,
            break_sessions_count,
            break_duration_total,
            last_work_session_at,
            last_break_session_at,
            updated_at
        )
        SELECT 
            task_user_combo.task_id,
            task_user_combo.user_id,
            COUNT(*) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
            COALESCE(SUM(duration_minutes) FILTER (WHERE session_type = 'work' AND session_status = 'completed'), 0),
            COUNT(*) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
            COALESCE(SUM(duration_minutes) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'), 0),
            MAX(completed_at) FILTER (WHERE session_type = 'work' AND session_status = 'completed'),
            MAX(completed_at) FILTER (WHERE session_type IN ('short_break', 'long_break') AND session_status = 'completed'),
            NOW()
        FROM public.pomodoro_sessions 
        WHERE task_id = task_user_combo.task_id AND user_id = task_user_combo.user_id;
    END LOOP;
END $$;

-- Source: 20250918090225_d205b7d4-6f0b-4cf1-9f74-07cdd6cc4814.sql
-- Add visibility column to goals table
ALTER TABLE public.goals 
ADD COLUMN visibility text DEFAULT 'all' CHECK (visibility IN ('all', 'managers', 'self'));

-- Update RLS policies for goals table
-- Drop the existing "Authenticated users can view active goals" policy
DROP POLICY IF EXISTS "Authenticated users can view active goals" ON public.goals;

-- Create new policy that respects visibility settings
CREATE POLICY "Users can view goals based on visibility" 
ON public.goals 
FOR SELECT 
USING (
  -- User can always see their own goals
  auth.uid() = user_id
  OR
  -- Admins can see all goals
  get_user_role(auth.uid()) = 'admin'
  OR
  -- For non-deleted, non-archived goals, check visibility
  (
    NOT is_deleted 
    AND NOT archived
    AND (
      -- 'all' visibility: everyone can see
      (visibility = 'all')
      OR
      -- 'managers' visibility: only managers and admins can see
      (visibility = 'managers' AND get_user_role(auth.uid()) IN ('manager', 'admin'))
      OR
      -- 'self' visibility is already handled by the first condition (auth.uid() = user_id)
      FALSE
    )
  )
  OR
  -- Users can see goals they're assigned to regardless of visibility
  EXISTS (
    SELECT 1 FROM public.goal_assignments 
    WHERE goal_id = goals.id 
    AND user_id = auth.uid()
  )
);

-- Source: 20250918095032_6ac14eef-6326-4de2-aebc-6338665d4614.sql
-- Update the RLS policy for viewing goals to be clearer and more comprehensive
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;

CREATE POLICY "Users can view goals based on visibility" 
ON public.goals 
FOR SELECT 
USING (
  -- User can always see their own goals
  auth.uid() = user_id
  OR
  -- Admins can see all goals
  get_user_role(auth.uid()) = 'admin'::text
  OR
  -- Managers can see all non-deleted, non-archived goals with 'all' or 'managers' visibility
  (
    get_user_role(auth.uid()) = 'manager'::text
    AND NOT is_deleted
    AND NOT archived
    AND (visibility = 'all'::text OR visibility = 'managers'::text)
  )
  OR
  -- Team members can see all non-deleted, non-archived goals with 'all' visibility
  (
    get_user_role(auth.uid()) = 'team-member'::text
    AND NOT is_deleted
    AND NOT archived
    AND visibility = 'all'::text
  )
  OR
  -- Any user can see goals they're assigned to
  EXISTS (
    SELECT 1 
    FROM goal_assignments 
    WHERE goal_assignments.goal_id = goals.id 
    AND goal_assignments.user_id = auth.uid()
  )
);

-- Source: 20250919013333_4bd37f02-1a56-4394-a624-0b05b51cc9c4.sql
-- Drop the overly permissive policy that allows managers to see ALL goals
DROP POLICY IF EXISTS "Managers and admins can view all goals" ON public.goals;

-- Ensure the visibility-based policy is comprehensive
-- This policy already exists and handles visibility correctly:
-- "Users can view goals based on visibility"
-- It allows:
-- 1. Users to see their own goals (regardless of visibility)
-- 2. Admins to see all goals
-- 3. Managers to see non-deleted, non-archived goals with visibility 'all' or 'managers'
-- 4. Team members to see non-deleted, non-archived goals with visibility 'all'
-- 5. Users assigned to a goal to see it

-- Let's also ensure private visibility is properly enforced
-- The existing policy should work, but let's make it more explicit
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;

CREATE POLICY "Users can view goals based on visibility" 
ON public.goals 
FOR SELECT 
USING (
  -- Users can always see their own goals
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all goals
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted, non-archived goals with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (NOT archived) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
    )
    -- Explicitly exclude private goals
    AND (visibility != 'private'::text OR visibility IS NULL)
  ) 
  OR 
  -- Team members can see non-deleted, non-archived goals with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (NOT archived) 
    AND (visibility = 'all'::text)
  ) 
  OR 
  -- Users assigned to a goal can see it
  (
    EXISTS (
      SELECT 1 
      FROM goal_assignments 
      WHERE goal_assignments.goal_id = goals.id 
      AND goal_assignments.user_id = auth.uid()
    )
  )
);

-- Source: 20250919014630_79ece9b7-cdcd-4c4d-beed-42c2cb0f97b7.sql
-- Add visibility column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN visibility text DEFAULT 'all'::text;

-- Add visibility column to weekly_outputs table  
ALTER TABLE public.weekly_outputs
ADD COLUMN visibility text DEFAULT 'all'::text;

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "All authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can view all tasks" ON public.tasks;

-- Create new visibility-based policy for tasks
CREATE POLICY "Users can view tasks based on visibility" 
ON public.tasks 
FOR SELECT 
USING (
  -- Users can always see their own tasks
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all tasks
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted tasks with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
      OR visibility IS NULL -- for backward compatibility
    )
  ) 
  OR 
  -- Team members can see non-deleted tasks with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (visibility = 'all'::text OR visibility IS NULL)
  ) 
  OR 
  -- Tagged users can see tasks they're tagged in
  (
    auth.uid() = ANY(tagged_users)
  )
);

-- Update RLS policies for weekly_outputs
DROP POLICY IF EXISTS "All authenticated users can view all weekly outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Managers and admins can view all weekly outputs" ON public.weekly_outputs;

-- Create new visibility-based policy for weekly_outputs
CREATE POLICY "Users can view weekly outputs based on visibility" 
ON public.weekly_outputs 
FOR SELECT 
USING (
  -- Users can always see their own outputs
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all outputs
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted outputs with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
      OR visibility IS NULL -- for backward compatibility
    )
  ) 
  OR 
  -- Team members can see non-deleted outputs with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (visibility = 'all'::text OR visibility IS NULL)
  )
);

-- Source: 20250919023900_b8ce7234-04f1-4162-922b-d543b6e440b2.sql
-- Add visibility column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN visibility text DEFAULT 'all'::text;

-- Add visibility column to weekly_outputs table  
ALTER TABLE public.weekly_outputs
ADD COLUMN visibility text DEFAULT 'all'::text;

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "All authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can view all tasks" ON public.tasks;

-- Create new visibility-based policy for tasks
CREATE POLICY "Users can view tasks based on visibility" 
ON public.tasks 
FOR SELECT 
USING (
  -- Users can always see their own tasks
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all tasks
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted tasks with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
      OR visibility IS NULL -- for backward compatibility
    )
  ) 
  OR 
  -- Team members can see non-deleted tasks with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (visibility = 'all'::text OR visibility IS NULL)
  ) 
  OR 
  -- Tagged users can see tasks they're tagged in
  (
    auth.uid()::text = ANY(tagged_users)
  )
);

-- Update RLS policies for weekly_outputs
DROP POLICY IF EXISTS "All authenticated users can view all weekly outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Managers and admins can view all weekly outputs" ON public.weekly_outputs;

-- Create new visibility-based policy for weekly_outputs
CREATE POLICY "Users can view weekly outputs based on visibility" 
ON public.weekly_outputs 
FOR SELECT 
USING (
  -- Users can always see their own outputs
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all outputs
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted outputs with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
      OR visibility IS NULL -- for backward compatibility
    )
  ) 
  OR 
  -- Team members can see non-deleted outputs with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (visibility = 'all'::text OR visibility IS NULL)
  )
);

-- Source: 20250919043923_8cd3455b-1a41-4955-a69e-70cb81bd28e3.sql
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;

-- Create a new policy that allows both owners and assigned users to update goals
CREATE POLICY "Users can update goals they own or are assigned to" ON public.goals
FOR UPDATE USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM goal_assignments 
    WHERE goal_assignments.goal_id = goals.id 
    AND goal_assignments.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM goal_assignments 
    WHERE goal_assignments.goal_id = goals.id 
    AND goal_assignments.user_id = auth.uid()
  )
);

-- Source: 20251208064200_c4f05fe3-da7c-405e-ae37-a3609c2689c5.sql
-- First, clean up existing duplicate entries (keep only the most recent assignment per goal/user)
DELETE FROM goal_assignments 
WHERE id NOT IN (
  SELECT DISTINCT ON (goal_id, user_id) id 
  FROM goal_assignments 
  ORDER BY goal_id, user_id, assigned_date DESC NULLS LAST
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE goal_assignments 
ADD CONSTRAINT unique_goal_user_assignment UNIQUE (goal_id, user_id);

-- Update the create_goal_assignment function to use upsert
CREATE OR REPLACE FUNCTION public.create_goal_assignment(p_goal_id uuid, p_user_id uuid, p_role text, p_assigned_by uuid, p_self_assigned boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use upsert to prevent duplicates - update role if assignment already exists
  INSERT INTO public.goal_assignments (
    goal_id,
    user_id,
    role,
    assigned_by,
    self_assigned,
    acknowledged
  ) VALUES (
    p_goal_id,
    p_user_id,
    p_role,
    p_assigned_by,
    p_self_assigned,
    false
  )
  ON CONFLICT (goal_id, user_id) 
  DO UPDATE SET 
    role = p_role,
    assigned_by = p_assigned_by,
    updated_at = now();
END;
$function$;

-- Source: 20251226233243_fec13074-6d7c-4475-846a-7ba3c3decfd3.sql
-- Create integration connections table for storing API configurations
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL DEFAULT 'zatzet_okr',
  api_endpoint TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_settings JSONB DEFAULT '{"autoSync": false, "direction": "import", "mappings": []}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

-- Create sync logs table to track imported items
CREATE TABLE public.integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  internal_id UUID,
  sync_status TEXT DEFAULT 'pending',
  sync_direction TEXT DEFAULT 'import',
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_connections (admin and manager only)
CREATE POLICY "Admins and managers can view integrations"
ON public.integration_connections
FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert integrations"
ON public.integration_connections
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

CREATE POLICY "Admins and managers can update their integrations"
ON public.integration_connections
FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

CREATE POLICY "Admins and managers can delete their integrations"
ON public.integration_connections
FOR DELETE
USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

-- RLS policies for integration_sync_logs
CREATE POLICY "Admins and managers can view sync logs"
ON public.integration_sync_logs
FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert sync logs"
ON public.integration_sync_logs
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update sync logs"
ON public.integration_sync_logs
FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create updated_at trigger for integration_connections
CREATE TRIGGER update_integration_connections_updated_at
BEFORE UPDATE ON public.integration_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251228092308_297206de-5020-4ac4-8403-1f0083c2f1d8.sql
-- Add column to track external sync time per goal
ALTER TABLE goals ADD COLUMN last_external_sync_at timestamptz;

-- Add index for faster lookups of OKR goals
CREATE INDEX IF NOT EXISTS idx_goals_subcategory ON goals(subcategory) WHERE subcategory = 'okr';

-- Source: 20251230041335_c6d0b961-41d1-489e-92bd-5f5f49d3e394.sql
-- Add columns to store OKR hierarchy information from Zatzet
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS external_key_result_id text,
ADD COLUMN IF NOT EXISTS external_key_result_title text,
ADD COLUMN IF NOT EXISTS external_objective_id text,
ADD COLUMN IF NOT EXISTS external_objective_title text;

-- Source: 20260330110442_3e58455b-32c4-4a65-a1ab-974463edebd4.sql

-- ===========================================
-- BASE SCHEMA: Create all pre-existing tables
-- ===========================================

-- 1. Helper function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Create habit_category enum
CREATE TYPE public.habit_category AS ENUM ('health', 'productivity', 'personal', 'fitness', 'learning', 'other', 'mental', 'relationship', 'social', 'spiritual', 'wealth');

-- 3. PROFILES table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team-member' CHECK (role IN ('admin', 'manager', 'team-member')),
  position TEXT,
  temporary_password TEXT,
  has_changed_password BOOLEAN DEFAULT false,
  user_status TEXT DEFAULT 'active' CHECK (user_status IN ('pending', 'active')),
  last_login TIMESTAMP WITH TIME ZONE,
  manager_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile trigger to auto-create on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, user_status, has_changed_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'team-member'),
    'active',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. get_user_role helper function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- 5. HABITS table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  streak INTEGER DEFAULT 0,
  category public.habit_category DEFAULT 'other',
  archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  last_completed_date DATE,
  linked_goal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. HABIT_COMPLETIONS table
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- 7. TASKS table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  original_due_date DATE,
  is_moved BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  completed_date TIMESTAMP WITH TIME ZONE,
  deleted_date TIMESTAMP WITH TIME ZONE,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weekly_output_id TEXT,
  tagged_users UUID[] DEFAULT '{}',
  visibility TEXT DEFAULT 'all',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. WEEKLY_OUTPUTS table
CREATE TABLE public.weekly_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  due_date DATE,
  original_due_date DATE,
  is_moved BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  completed_date TIMESTAMP WITH TIME ZONE,
  deleted_date TIMESTAMP WITH TIME ZONE,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  linked_goal_id UUID,
  visibility TEXT DEFAULT 'all',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_outputs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_weekly_outputs_updated_at
BEFORE UPDATE ON public.weekly_outputs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. MOOD_ENTRIES table
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_mood_entries_updated_at
BEFORE UPDATE ON public.mood_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. GOALS table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'percent',
  category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('work', 'personal')),
  subcategory TEXT,
  deadline DATE,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),
  coach_id UUID,
  lead_ids UUID[] DEFAULT '{}',
  member_ids UUID[] DEFAULT '{}',
  created_by UUID,
  assignment_date TIMESTAMP WITH TIME ZONE,
  visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'managers', 'self')),
  last_external_sync_at TIMESTAMPTZ,
  external_key_result_id TEXT,
  external_key_result_title TEXT,
  external_objective_id TEXT,
  external_objective_title TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK for habits -> goals
ALTER TABLE public.habits 
ADD CONSTRAINT habits_linked_goal_id_fkey 
FOREIGN KEY (linked_goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;

-- Add FK for weekly_outputs -> goals
ALTER TABLE public.weekly_outputs 
ADD CONSTRAINT weekly_outputs_linked_goal_id_fkey 
FOREIGN KEY (linked_goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;

-- 11. GOAL_ASSIGNMENTS table
CREATE TABLE public.goal_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  self_assigned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

ALTER TABLE public.goal_assignments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_goal_assignments_updated_at
BEFORE UPDATE ON public.goal_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. GOAL_NOTIFICATIONS table
CREATE TABLE public.goal_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('assignment', 'self_assignment')),
  role TEXT NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_notifications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_goal_notifications_updated_at
BEFORE UPDATE ON public.goal_notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. POMODORO_SESSIONS table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  session_id UUID DEFAULT gen_random_uuid(),
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  session_status TEXT DEFAULT 'completed' CHECK (session_status IN ('active', 'paused', 'stopped', 'completed', 'skipped', 'terminated')),
  pomodoro_number INTEGER DEFAULT 1,
  break_number INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interrupted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- 14. ACTIVE_POMODORO_SESSIONS table
CREATE TABLE public.active_pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  session_id UUID NOT NULL,
  task_title TEXT,
  session_status TEXT NOT NULL CHECK (session_status IN ('active-stopped', 'active-running', 'active-paused', 'terminated')) DEFAULT 'active-stopped',
  current_session_type TEXT NOT NULL CHECK (current_session_type IN ('work', 'short_break', 'long_break')) DEFAULT 'work',
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  sessions_until_long_break INTEGER NOT NULL DEFAULT 4,
  completed_work_sessions INTEGER NOT NULL DEFAULT 0,
  completed_break_sessions INTEGER NOT NULL DEFAULT 0,
  current_start_time TIMESTAMP WITH TIME ZONE,
  current_pause_time TIMESTAMP WITH TIME ZONE,
  current_time_remaining INTEGER,
  is_card_visible BOOLEAN NOT NULL DEFAULT true,
  is_floating_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.active_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_active_pomodoro_sessions_updated_at
BEFORE UPDATE ON public.active_pomodoro_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. TASK_POMODORO_STATS table
CREATE TABLE public.task_pomodoro_stats (
  task_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_sessions_count INTEGER NOT NULL DEFAULT 0,
  work_duration_total INTEGER NOT NULL DEFAULT 0,
  break_sessions_count INTEGER NOT NULL DEFAULT 0,
  break_duration_total INTEGER NOT NULL DEFAULT 0,
  last_work_session_at TIMESTAMP WITH TIME ZONE,
  last_break_session_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

ALTER TABLE public.task_pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- 16. INTEGRATION_CONNECTIONS table
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL DEFAULT 'zatzet_okr',
  api_endpoint TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_settings JSONB DEFAULT '{"autoSync": false, "direction": "import", "mappings": []}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_integration_connections_updated_at
BEFORE UPDATE ON public.integration_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. INTEGRATION_SYNC_LOGS table
CREATE TABLE public.integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  internal_id UUID,
  sync_status TEXT DEFAULT 'pending',
  sync_direction TEXT DEFAULT 'import',
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Managers can view non-admin profiles" ON public.profiles FOR SELECT USING (get_user_role(auth.uid()) = 'manager' AND role IN ('team-member', 'manager'));
CREATE POLICY "Team members can view non-admin profiles" ON public.profiles FOR SELECT USING (get_user_role(auth.uid()) = 'team-member' AND role IN ('team-member', 'manager') AND id != auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Habits
CREATE POLICY "All authenticated users can view all habits" ON public.habits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habit completions
CREATE POLICY "Users can manage their own completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "All users can view completions" ON public.habit_completions FOR SELECT TO authenticated USING (true);

-- Tasks
CREATE POLICY "Users can view tasks based on visibility" ON public.tasks FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR get_user_role(auth.uid()) IN ('admin', 'manager') OR visibility = 'all'
);
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Weekly outputs
CREATE POLICY "Users can view outputs based on visibility" ON public.weekly_outputs FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR get_user_role(auth.uid()) IN ('admin', 'manager') OR visibility = 'all'
);
CREATE POLICY "Users can manage their own outputs" ON public.weekly_outputs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mood entries
CREATE POLICY "All authenticated users can view all mood entries" ON public.mood_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own mood" ON public.mood_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals
CREATE POLICY "Users can view goals based on visibility" ON public.goals FOR SELECT USING (
  auth.uid() = user_id OR get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'manager' AND NOT is_deleted AND NOT archived AND visibility IN ('all', 'managers')) OR
  (NOT is_deleted AND NOT archived AND visibility = 'all') OR
  EXISTS (SELECT 1 FROM goal_assignments WHERE goal_id = goals.id AND goal_assignments.user_id = auth.uid())
);
CREATE POLICY "Users can create goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update goals they own or are assigned to" ON public.goals FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM goal_assignments WHERE goal_id = goals.id AND goal_assignments.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Goal assignments
CREATE POLICY "Users can view their assignments" ON public.goal_assignments FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = assigned_by OR get_user_role(auth.uid()) IN ('admin', 'manager')
);
CREATE POLICY "Authenticated users can create assignments" ON public.goal_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their assignments" ON public.goal_assignments FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_by);
CREATE POLICY "Users can delete their own assignments" ON public.goal_assignments FOR DELETE USING (auth.uid() = user_id);

-- Goal notifications
CREATE POLICY "Users can view their own notifications" ON public.goal_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.goal_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.goal_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Pomodoro sessions
CREATE POLICY "Users can view their own pomodoro sessions" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own pomodoro sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can view all pomodoro sessions" ON public.pomodoro_sessions FOR SELECT USING (get_user_role(auth.uid()) IN ('manager', 'admin'));

-- Active pomodoro sessions
CREATE POLICY "Users can manage their own active sessions" ON public.active_pomodoro_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can view all active sessions" ON public.active_pomodoro_sessions FOR SELECT USING (get_user_role(auth.uid()) IN ('manager', 'admin'));

-- Task pomodoro stats
CREATE POLICY "Users can manage their own task stats" ON public.task_pomodoro_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can view all task stats" ON public.task_pomodoro_stats FOR SELECT USING (get_user_role(auth.uid()) IN ('manager', 'admin'));

-- Integration connections
CREATE POLICY "Admins and managers can manage integrations" ON public.integration_connections FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

-- Integration sync logs
CREATE POLICY "Admins and managers can manage sync logs" ON public.integration_sync_logs FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- ===========================================
-- DATABASE FUNCTIONS
-- ===========================================

-- get_filtered_users_for_role
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE requesting_user_role text;
BEGIN
  SELECT p.role INTO requesting_user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF requesting_user_role = 'admin' THEN
    RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at FROM public.profiles p WHERE p.user_status = 'active' ORDER BY p.name;
  ELSE
    RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at FROM public.profiles p WHERE p.user_status = 'active' AND p.role IN ('team-member', 'manager') AND p.id != auth.uid() ORDER BY p.name;
  END IF;
END;
$$;

-- get_all_users_for_admin
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone, temporary_password text, has_changed_password boolean, last_login timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE requesting_user_role text;
BEGIN
  SELECT p.role INTO requesting_user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF requesting_user_role != 'admin' THEN RETURN; END IF;
  RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at, p.temporary_password, p.has_changed_password, p.last_login FROM public.profiles p ORDER BY p.created_at DESC;
END;
$$;

-- get_habits_for_date
CREATE OR REPLACE FUNCTION public.get_habits_for_date(user_id_param uuid, target_date date)
RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT h.id, h.name, h.description, h.category::TEXT, h.streak, h.archived, h.is_deleted, h.created_at,
    COALESCE(hc.completed_date IS NOT NULL, FALSE) as completed, h.linked_goal_id
  FROM habits h
  LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completed_date = target_date
  WHERE h.user_id = user_id_param
  ORDER BY h.created_at DESC;
END;
$$;

-- toggle_habit_completion
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF is_completed THEN
    INSERT INTO public.habit_completions (habit_id, user_id, completed_date) VALUES (habit_id_param, user_id_param, target_date) ON CONFLICT (habit_id, completed_date) DO NOTHING;
    UPDATE public.habits SET last_completed_date = target_date, streak = CASE WHEN last_completed_date = target_date - INTERVAL '1 day' THEN streak + 1 WHEN last_completed_date IS NULL OR last_completed_date < target_date - INTERVAL '1 day' THEN 1 ELSE streak END WHERE id = habit_id_param AND user_id = user_id_param;
  ELSE
    DELETE FROM public.habit_completions WHERE habit_id = habit_id_param AND completed_date = target_date AND user_id = user_id_param;
    UPDATE public.habits SET streak = 0, last_completed_date = NULL WHERE id = habit_id_param AND user_id = user_id_param;
  END IF;
END;
$$;

-- create_goal_assignment
CREATE OR REPLACE FUNCTION public.create_goal_assignment(p_goal_id uuid, p_user_id uuid, p_role text, p_assigned_by uuid, p_self_assigned boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO goal_assignments (goal_id, user_id, role, assigned_by, self_assigned) VALUES (p_goal_id, p_user_id, p_role, p_assigned_by, p_self_assigned) ON CONFLICT (goal_id, user_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by, self_assigned = EXCLUDED.self_assigned, updated_at = now();
END;
$$;

-- create_goal_notification
CREATE OR REPLACE FUNCTION public.create_goal_notification(p_user_id uuid, p_goal_id uuid, p_notification_type text, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO goal_notifications (user_id, goal_id, notification_type, role) VALUES (p_user_id, p_goal_id, p_notification_type, p_role);
END;
$$;

-- Task pomodoro stats trigger
CREATE OR REPLACE FUNCTION public.update_task_pomodoro_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.session_status = 'completed' AND NEW.interrupted = false THEN
      INSERT INTO public.task_pomodoro_stats (task_id, user_id, work_sessions_count, work_duration_total, break_sessions_count, break_duration_total, last_work_session_at, last_break_session_at, updated_at)
      VALUES (
        COALESCE(NEW.task_id, '00000000-0000-0000-0000-000000000000'::uuid), NEW.user_id,
        CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        CASE WHEN NEW.session_type = 'work' THEN NEW.completed_at ELSE NULL END,
        CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at ELSE NULL END,
        NOW()
      )
      ON CONFLICT (task_id, user_id) DO UPDATE SET
        work_sessions_count = task_pomodoro_stats.work_sessions_count + CASE WHEN NEW.session_type = 'work' THEN 1 ELSE 0 END,
        work_duration_total = task_pomodoro_stats.work_duration_total + CASE WHEN NEW.session_type = 'work' THEN NEW.duration_minutes ELSE 0 END,
        break_sessions_count = task_pomodoro_stats.break_sessions_count + CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN 1 ELSE 0 END,
        break_duration_total = task_pomodoro_stats.break_duration_total + CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.duration_minutes ELSE 0 END,
        last_work_session_at = CASE WHEN NEW.session_type = 'work' THEN NEW.completed_at ELSE task_pomodoro_stats.last_work_session_at END,
        last_break_session_at = CASE WHEN NEW.session_type IN ('short_break', 'long_break') THEN NEW.completed_at ELSE task_pomodoro_stats.last_break_session_at END,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_task_pomodoro_stats_trigger
AFTER INSERT ON public.pomodoro_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_task_pomodoro_stats();

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_weekly_outputs_user_id ON public.weekly_outputs(user_id);
CREATE INDEX idx_weekly_outputs_linked_goal_id ON public.weekly_outputs(linked_goal_id);
CREATE INDEX idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_category ON public.goals(category);
CREATE INDEX idx_goals_deadline ON public.goals(deadline);
CREATE INDEX idx_goals_subcategory ON public.goals(subcategory) WHERE subcategory = 'okr';
CREATE INDEX idx_pomodoro_sessions_user_task ON public.pomodoro_sessions(user_id, task_id);
CREATE INDEX idx_pomodoro_sessions_completed_at ON public.pomodoro_sessions(completed_at DESC);
CREATE INDEX idx_pomodoro_sessions_session_id ON public.pomodoro_sessions(session_id);
CREATE INDEX idx_task_pomodoro_stats_task_id ON public.task_pomodoro_stats(task_id);
CREATE INDEX idx_task_pomodoro_stats_user_id ON public.task_pomodoro_stats(user_id);

-- ===========================================
-- REALTIME
-- ===========================================
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER TABLE public.goal_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.goal_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.active_pomodoro_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.task_pomodoro_stats REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_pomodoro_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_pomodoro_stats;


-- Source: 20260708000000_enforce_private_visibility_rls.sql
-- Drop old permissive policy
DROP POLICY IF EXISTS "Authenticated users can view active goals" ON public.goals;

-- New policy: public goals visible to all, private goals only to owner or assigned members
CREATE POLICY "Visibility-based goal access"
ON public.goals FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND (
    -- Public or managers-only: visible to all authenticated users (managers filter on frontend)
    visibility IN ('all', 'managers')
    -- Private: only owner or assigned member
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM goal_assignments
      WHERE goal_assignments.goal_id = goals.id
        AND goal_assignments.user_id = auth.uid()
    )
  )
);


-- Source: 20260708000001_add_intern_role.sql
-- Add 'intern' role to public.profiles

-- 1. Drop existing role check constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add the new constraint including 'intern'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'manager', 'team-member', 'intern'));

-- 3. Update the get_filtered_users_for_role function to include logic for 'intern'
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  position text,
  user_status text,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all active/pending users
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.position, p.user_status::text, p.created_at
    FROM public.profiles p
    ORDER BY p.name ASC;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team-members, interns, and other managers
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager', 'intern')
    ORDER BY p.name ASC;
    
  ELSE
    -- Team members and interns can only see active team members, managers, and interns
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p.position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
      AND p.role IN ('team-member', 'manager', 'intern')
    ORDER BY p.name ASC;
  END IF;
END;
$$;


-- Source: 20260708000002_update_goals_rls.sql
-- Update Goals RLS for strict role-based access

-- Drop previous overlapping policies
DROP POLICY IF EXISTS "Visibility-based goal access" ON public.goals;
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can view active goals" ON public.goals;

-- Unified Role-Based and Visibility-Based SELECT Policy
CREATE POLICY "Role and Visibility based goal access"
ON public.goals FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND (
    -- 1. Owner always sees
    user_id = auth.uid()
    OR
    -- 2. Collaborators always see
    EXISTS (
      SELECT 1 FROM public.goal_assignments
      WHERE goal_assignments.goal_id = goals.id
        AND goal_assignments.user_id = auth.uid()
    )
    OR
    -- 3. Admins and Managers see EVERYTHING (Public and Private)
    get_user_role(auth.uid()) IN ('admin', 'manager')
    OR
    -- 4. Team-Members see ONLY 'all' (Public) goals
    -- (Interns fall through this check and only see via Owner or Collaborator rules above)
    (
      get_user_role(auth.uid()) = 'team-member'
      AND visibility = 'all'
    )
  )
);


