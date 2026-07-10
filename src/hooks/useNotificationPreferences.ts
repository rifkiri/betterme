import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  notify_new_task: boolean;
  notify_deadline_1hr: boolean;
  notify_team_added: boolean;
  notify_role_updates: boolean;
}

const DEFAULTS: NotificationPreferences = {
  notify_new_task: true,
  notify_deadline_1hr: true,
  notify_team_added: true,
  notify_role_updates: true,
};

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
      .select('notify_new_task,notify_deadline_1hr,notify_team_added,notify_role_updates')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setPreferences(data);
      prefsRef.current = data;
    } else if (!data && user.id) {
      // seed row if missing (trigger should have done it, but be safe)
      const { data: inserted } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id, ...DEFAULTS })
        .select('notify_new_task,notify_deadline_1hr,notify_team_added,notify_role_updates')
        .maybeSingle();
      if (inserted) {
        setPreferences(inserted);
        prefsRef.current = inserted;
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
        // revert
        const reverted = { ...prefsRef.current, [key]: !value };
        setPreferences(reverted);
        prefsRef.current = reverted;
      }
    },
    [user?.id]
  );

  return { preferences, prefsRef, isLoading, updatePreference, reload: load };
};
