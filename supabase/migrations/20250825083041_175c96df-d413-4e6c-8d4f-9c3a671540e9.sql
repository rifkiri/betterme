-- Create pomodoro_sessions table for tracking completed sessions
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interrupted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own pomodoro sessions" 
ON public.pomodoro_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create their own pomodoro sessions" 
ON public.pomodoro_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Managers can view all sessions
CREATE POLICY "Managers can view all pomodoro sessions" 
ON public.pomodoro_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Add index for performance
CREATE INDEX idx_pomodoro_sessions_user_task ON public.pomodoro_sessions(user_id, task_id);
CREATE INDEX idx_pomodoro_sessions_completed_at ON public.pomodoro_sessions(completed_at DESC);