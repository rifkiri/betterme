
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
