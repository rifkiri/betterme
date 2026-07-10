
-- 1. Create table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  notify_new_task BOOLEAN NOT NULL DEFAULT true,
  notify_deadline_1hr BOOLEAN NOT NULL DEFAULT true,
  notify_team_added BOOLEAN NOT NULL DEFAULT true,
  notify_role_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

-- 3. Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Policies (users only see/update their own)
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages all notification preferences"
  ON public.notification_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Function to seed defaults per role
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    user_id,
    notify_new_task,
    notify_deadline_1hr,
    notify_team_added,
    notify_role_updates
  ) VALUES (
    NEW.id,
    -- Managers/admins want to know about all new tasks; team members opt out by default
    CASE WHEN NEW.role IN ('manager', 'admin') THEN true ELSE false END,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 7. Trigger on profiles
CREATE TRIGGER seed_notification_preferences_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();

-- 8. Backfill preferences for existing profiles
INSERT INTO public.notification_preferences (user_id, notify_new_task, notify_deadline_1hr, notify_team_added, notify_role_updates)
SELECT
  p.id,
  CASE WHEN p.role IN ('manager', 'admin') THEN true ELSE false END,
  true,
  true,
  true
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;
