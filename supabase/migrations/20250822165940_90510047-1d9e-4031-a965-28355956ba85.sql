-- Enable real-time updates for goal_assignments table
ALTER TABLE public.goal_assignments REPLICA IDENTITY FULL;

-- Add goal_assignments to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_assignments;