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
