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