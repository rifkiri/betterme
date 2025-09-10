-- Add session_id to pomodoro_sessions table to group related work/break sessions
ALTER TABLE public.pomodoro_sessions 
ADD COLUMN session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN session_status TEXT DEFAULT 'completed' CHECK (session_status IN ('active', 'paused', 'stopped', 'completed')),
ADD COLUMN pomodoro_number INTEGER DEFAULT 1,
ADD COLUMN break_number INTEGER DEFAULT 0;

-- Create index for better querying by session_id
CREATE INDEX idx_pomodoro_sessions_session_id ON public.pomodoro_sessions(session_id);
CREATE INDEX idx_pomodoro_sessions_user_task ON public.pomodoro_sessions(user_id, task_id);

-- Create table for active pomodoro sessions to track current state
CREATE TABLE public.active_pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID,
  session_id UUID NOT NULL,
  task_title TEXT,
  session_status TEXT NOT NULL CHECK (session_status IN ('active-stopped', 'active-running', 'active-paused', 'terminated')) DEFAULT 'active-stopped',
  current_session_type TEXT NOT NULL CHECK (current_session_type IN ('work', 'short_break', 'long_break')) DEFAULT 'work',
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  sessions_until_long_break INTEGER NOT NULL DEFAULT 4,
  completed_work_sessions INTEGER NOT NULL DEFAULT 0,
  completed_break_sessions INTEGER NOT NULL DEFAULT 0,
  current_start_time TIMESTAMP WITH TIME ZONE,
  current_pause_time TIMESTAMP WITH TIME ZONE,
  current_time_remaining INTEGER, -- in seconds
  is_card_visible BOOLEAN NOT NULL DEFAULT true,
  is_floating_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for active_pomodoro_sessions
ALTER TABLE public.active_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for active_pomodoro_sessions
CREATE POLICY "Users can manage their own active sessions" 
ON public.active_pomodoro_sessions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all active sessions" 
ON public.active_pomodoro_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_active_pomodoro_sessions_updated_at
BEFORE UPDATE ON public.active_pomodoro_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();