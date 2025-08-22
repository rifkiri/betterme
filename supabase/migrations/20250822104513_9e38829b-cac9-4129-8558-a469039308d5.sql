-- Enable real-time for goal-related tables
ALTER TABLE goals REPLICA IDENTITY FULL;
ALTER TABLE goal_assignments REPLICA IDENTITY FULL;
ALTER TABLE goal_notifications REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_notifications;

-- Clean up dual storage system - remove legacy role arrays since we're using goal_assignments
ALTER TABLE goals DROP COLUMN coach_id;
ALTER TABLE goals DROP COLUMN lead_ids;
ALTER TABLE goals DROP COLUMN member_ids;