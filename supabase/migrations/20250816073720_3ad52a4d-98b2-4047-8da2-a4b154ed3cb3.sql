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