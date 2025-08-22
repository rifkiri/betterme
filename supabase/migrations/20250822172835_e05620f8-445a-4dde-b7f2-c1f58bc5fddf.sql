-- Remove conflicting RLS policies on habits table
DROP POLICY IF EXISTS "All authenticated users can view all habits" ON public.habits;

-- Ensure we have clean, non-conflicting policies
-- Keep the user-specific policies which are more secure
-- This should resolve the flickering issue caused by conflicting SELECT policies