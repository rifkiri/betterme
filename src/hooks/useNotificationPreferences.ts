import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  notify_new_task: boolean;
  notify_deadline_1hr: boolean;
  notify_team_added: boolean;
  notify_role_updates: boolean;
  notify_goal_updates: boolean;
  notify_task_updates: boolean;
  notify_output_updates: boolean;
  notify_assignment_response: boolean;
  notify_daily_digest: boolean;
  notify_mention: boolean;
}

const DEFAULTS: NotificationPreferences = {
  notify_new_task: true,
  notify_deadline_1hr: true,
  notify_team_added: true,
  notify_role_updates: true,
  notify_goal_updates: true,
  notify_task_updates: true,
  notify_output_updates: true,
  notify_assignment_response: true,
  notify_daily_digest: false,
  notify_mention: true,
};

const COLUMNS =
  'notify_new_task,notify_deadline_1hr,notify_team_added,notify_role_updates,notify_goal_updates,notify_task_updates,notify_output_updates,notify_assignment_response,notify_daily_digest,notify_mention';

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const prefsRef = useRef<NotificationPreferences>(DEFAULTS);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notification_preferences')
      .select(COLUMNS)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      const merged = { ...DEFAULTS, ...(data as any) } as NotificationPreferences;
      setPreferences(merged);
      prefsRef.current = merged;
    } else if (!data && user.id) {
      const { data: inserted } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id, ...DEFAULTS })
        .select(COLUMNS)
        .maybeSingle();
      if (inserted) {
        const merged = { ...DEFAULTS, ...(inserted as any) } as NotificationPreferences;
        setPreferences(merged);
        prefsRef.current = merged;
      }
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!user?.id) return;
      const optimistic = { ...prefsRef.current, [key]: value };
      setPreferences(optimistic);
      prefsRef.current = optimistic;
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);
      if (error) {
        const reverted = { ...prefsRef.current, [key]: !value };
        setPreferences(reverted);
        prefsRef.current = reverted;
      }
    },
    [user?.id]
  );

  return { preferences, prefsRef, isLoading, updatePreference, reload: load };
};
