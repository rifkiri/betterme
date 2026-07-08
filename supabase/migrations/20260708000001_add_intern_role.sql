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
