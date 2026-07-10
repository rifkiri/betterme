import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const DEADLINE_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Global notification daemon. Mount once (inside AuthProvider) so it listens
 * for realtime task/goal events and periodically checks for approaching deadlines.
 */
export const useNotificationDaemon = () => {
  const { user } = useAuth();
  const { isManagerOrAdmin } = useUserRole();
  const { notify, permission } = useBrowserNotifications(false);
  const { prefsRef } = useNotificationPreferences();
  const notifiedDeadlinesRef = useRef<Set<string>>(new Set());

  // Realtime: new tasks + team assignments
  useEffect(() => {
    if (!user?.id) return;

    const goalsChannel = supabase
      .channel('notif-daemon-goals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'goals' },
        (payload: any) => {
          if (permission !== 'granted') return;
          if (!prefsRef.current.notify_new_task) return;
          const row = payload.new;
          // Skip own creations
          if (row?.user_id === user.id) return;
          const title = isManagerOrAdmin
            ? 'A team member created a task'
            : 'New task available';
          notify(title, { body: row?.title || 'A new task was added.' });
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel('notif-daemon-assignments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'goal_assignments', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (permission !== 'granted') return;
          if (!prefsRef.current.notify_team_added) return;
          const row = payload.new;
          if (row?.self_assigned) return;
          const title = isManagerOrAdmin
            ? "You've been added to a team task"
            : "You've been assigned to a new task";
          notify(title, { body: `Role: ${row?.role ?? 'member'}` });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [user?.id, isManagerOrAdmin, notify, permission, prefsRef]);

  // Deadline check every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const checkDeadlines = async () => {
      if (permission !== 'granted') return;
      if (!prefsRef.current.notify_deadline_1hr) return;

      const now = new Date();
      // Deadlines in this project are stored as DATE (day precision). We treat
      // items whose deadline is today AND within the final hour of the day as
      // "less than an hour away" to satisfy the 1-hour warning contract.
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      const msUntilEndOfDay = endOfToday.getTime() - now.getTime();
      const todayStr = now.toISOString().slice(0, 10);

      if (msUntilEndOfDay > ONE_HOUR_MS) return;

      const { data: goals } = await supabase
        .from('goals')
        .select('id,title,deadline,progress,is_deleted,user_id')
        .eq('user_id', user.id)
        .eq('deadline', todayStr);

      (goals || []).forEach((g: any) => {
        if (g.is_deleted || (g.progress ?? 0) >= 100) return;
        const key = `goal:${g.id}:${todayStr}`;
        if (notifiedDeadlinesRef.current.has(key)) return;
        notifiedDeadlinesRef.current.add(key);
        notify('Deadline approaching', {
          body: `${g.title} is due in less than an hour!`,
        });
      });

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id,title,due_date,completed,user_id')
        .eq('user_id', user.id)
        .eq('due_date', todayStr);

      (tasks || []).forEach((t: any) => {
        if (t.completed) return;
        const key = `task:${t.id}:${todayStr}`;
        if (notifiedDeadlinesRef.current.has(key)) return;
        notifiedDeadlinesRef.current.add(key);
        notify('Deadline approaching', {
          body: `${t.title} is due in less than an hour!`,
        });
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, DEADLINE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.id, notify, permission, prefsRef]);
};
