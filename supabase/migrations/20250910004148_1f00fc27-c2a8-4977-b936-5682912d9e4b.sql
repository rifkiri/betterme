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