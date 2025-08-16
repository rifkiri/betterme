-- Add RLS policies for goal_assignments
CREATE POLICY "Users can view their own goal assignments"
  ON goal_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all goal assignments"
  ON goal_assignments FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Managers can create goal assignments"
  ON goal_assignments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Users can create self-assignments as members"
  ON goal_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'member' AND self_assigned = true);

CREATE POLICY "Managers can update goal assignments"
  ON goal_assignments FOR UPDATE
  USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Users can acknowledge their assignments"
  ON goal_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for goal_notifications
CREATE POLICY "Users can view their own notifications"
  ON goal_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON goal_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON goal_notifications FOR UPDATE
  USING (auth.uid() = user_id);