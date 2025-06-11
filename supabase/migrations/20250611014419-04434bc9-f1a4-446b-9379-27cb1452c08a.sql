
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
