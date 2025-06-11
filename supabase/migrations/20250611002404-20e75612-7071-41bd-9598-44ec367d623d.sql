
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
