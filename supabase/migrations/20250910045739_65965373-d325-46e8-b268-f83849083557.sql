-- Enable real-time for active_pomodoro_sessions table
ALTER TABLE public.active_pomodoro_sessions REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_pomodoro_sessions;