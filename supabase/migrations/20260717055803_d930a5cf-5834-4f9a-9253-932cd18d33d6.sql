
-- ============================================================
-- Resource Links table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resource_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('task', 'weekly_output', 'goal')),
  entity_id   uuid NOT NULL,
  label       text NOT NULL,
  url         text NOT NULL,
  added_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_links TO authenticated;
GRANT ALL ON public.resource_links TO service_role;

ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS resource_links_entity_idx
  ON public.resource_links (entity_type, entity_id);

CREATE POLICY "Authenticated users can read resource links"
  ON public.resource_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own resource links"
  ON public.resource_links FOR INSERT
  TO authenticated
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "Adder can update resource links"
  ON public.resource_links FOR UPDATE
  TO authenticated
  USING (added_by = auth.uid());

CREATE POLICY "Adder can delete resource links"
  ON public.resource_links FOR DELETE
  TO authenticated
  USING (added_by = auth.uid());

-- ============================================================
-- Add tagged_users to weekly_outputs
-- ============================================================
ALTER TABLE public.weekly_outputs
  ADD COLUMN IF NOT EXISTS tagged_users text[] DEFAULT '{}';

-- ============================================================
-- Collaborator UPDATE policies
-- ============================================================

-- Tasks
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Owners and collaborators can update tasks" ON public.tasks;
CREATE POLICY "Owners and collaborators can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (tagged_users IS NOT NULL AND tagged_users @> ARRAY[auth.uid()::text])
  );

-- Weekly Outputs
DROP POLICY IF EXISTS "Users can update their own weekly outputs" ON public.weekly_outputs;
DROP POLICY IF EXISTS "Owners and collaborators can update weekly outputs" ON public.weekly_outputs;
CREATE POLICY "Owners and collaborators can update weekly outputs"
  ON public.weekly_outputs FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (tagged_users IS NOT NULL AND tagged_users @> ARRAY[auth.uid()::text])
  );

-- Goals
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Owners and assigned users can update goals" ON public.goals;
CREATE POLICY "Owners and assigned users can update goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.goal_assignments
      WHERE goal_id = goals.id
        AND user_id = auth.uid()
    )
  );
