import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const DEADLINE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Global notification daemon. Mount once (inside AuthProvider). Listens for
 * realtime task/goal/output/assignment events, gates them by the user's
 * preferences, and also polls for approaching deadlines.
 */
export const useNotificationDaemon = () => {
  const { user } = useAuth();
  const { isManagerOrAdmin } = useUserRole();
  const { notify } = useBrowserNotifications(false);
  const { prefsRef } = useNotificationPreferences();
  const notifiedDeadlinesRef = useRef<Set<string>>(new Set());
  const notifiedUpdatesRef = useRef<Set<string>>(new Set());
  // Cache of goal IDs the user is a member of, refreshed on realtime events
  const memberGoalsRef = useRef<Set<string>>(new Set());

  // Load & keep updated: goal IDs where user is an acknowledged collaborator
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase
        .from('goal_assignments')
        .select('goal_id')
        .eq('user_id', user.id)
        .eq('acknowledged', true);
      if (cancelled) return;
      memberGoalsRef.current = new Set((data || []).map((r: any) => r.goal_id));
    };
    refresh();

    const ch = supabase
      .channel('notif-daemon-membership')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goal_assignments', filter: `user_id=eq.${user.id}` },
        refresh
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  // Realtime: goals (INSERT + UPDATE), tasks (INSERT + UPDATE), outputs (UPDATE),
  // assignments (INSERT + UPDATE), tasks tagged with @mention
  useEffect(() => {
    if (!user?.id) return;

    const goalsChannel = supabase
      .channel('notif-daemon-goals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'goals' },
        (payload: any) => {
          if (!prefsRef.current.notify_new_task) return;
          const row = payload.new;
          if (row?.user_id === user.id) return;
          const title = isManagerOrAdmin ? 'A team member created a goal' : 'New goal available';
          notify(title, { body: row?.title || 'A new goal was added.' });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'goals' },
        (payload: any) => {
          if (!prefsRef.current.notify_goal_updates) return;
          const row = payload.new;
          const old = payload.old || {};
          if (!row) return;
          const isOwner = row.user_id === user.id;
          const isMember = memberGoalsRef.current.has(row.id);
          if (!isOwner && !isMember) return;
          if (isOwner && row.user_id === user.id && old.user_id === user.id) {
            // Owner-initiated edits are noisy; skip if only the owner touched fields we don't care about.
            // Keep firing for completion or big progress jumps.
          }
          const key = `goal-update:${row.id}:${row.progress}:${row.completed}:${row.deadline}`;
          if (notifiedUpdatesRef.current.has(key)) return;
          notifiedUpdatesRef.current.add(key);
          let body = 'A goal you belong to was updated.';
          if (old && old.progress !== row.progress) {
            body = `Progress: ${old.progress ?? 0}% \u2192 ${row.progress ?? 0}%`;
          } else if (row.completed && !old.completed) {
            body = 'Goal marked complete \ud83c\udf89';
          } else if (old.deadline !== row.deadline) {
            body = 'Deadline changed.';
          } else if (old.title !== row.title) {
            body = `Renamed to \u201c${row.title}\u201d`;
          }
          notify(`Goal updated: ${row.title || ''}`.trim(), { body });
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('notif-daemon-tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          const isMine = row.user_id === user.id;
          const tagged = Array.isArray(row.tagged_users) && row.tagged_users.includes(user.id);
          if (isMine) return;
          if (tagged && prefsRef.current.notify_mention) {
            notify('You were tagged on a task', { body: row.title || 'A task tagged you.' });
            return;
          }
          if (prefsRef.current.notify_new_task) {
            notify('New task created', { body: row.title || 'A new task was added.' });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload: any) => {
          if (!prefsRef.current.notify_task_updates) return;
          const row = payload.new;
          const old = payload.old || {};
          if (!row) return;
          const isOwner = row.user_id === user.id;
          const tagged = Array.isArray(row.tagged_users) && row.tagged_users.includes(user.id);
          if (!isOwner && !tagged) return;
          if (isOwner) return; // skip own edits
          const key = `task-update:${row.id}:${row.completed}:${row.due_date}:${row.title}`;
          if (notifiedUpdatesRef.current.has(key)) return;
          notifiedUpdatesRef.current.add(key);
          let body = 'A task you\u2019re on was updated.';
          if (row.completed && !old.completed) body = 'Marked complete \u2705';
          else if (old.due_date !== row.due_date) body = 'Due date changed.';
          else if (old.title !== row.title) body = `Renamed to \u201c${row.title}\u201d`;
          notify(`Task updated: ${row.title || ''}`.trim(), { body });
        }
      )
      .subscribe();

    const outputsChannel = supabase
      .channel('notif-daemon-outputs')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'weekly_outputs', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (!prefsRef.current.notify_output_updates) return;
          const row = payload.new;
          const old = payload.old || {};
          if (!row) return;
          if (row.progress === old.progress && row.title === old.title && row.due_date === old.due_date) return;
          const key = `output-update:${row.id}:${row.progress}:${row.title}:${row.due_date}`;
          if (notifiedUpdatesRef.current.has(key)) return;
          notifiedUpdatesRef.current.add(key);
          notify(`Output updated: ${row.title || ''}`.trim(), {
            body: old.progress !== row.progress ? `Progress: ${old.progress ?? 0}% \u2192 ${row.progress ?? 0}%` : 'Details changed.',
          });
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel('notif-daemon-assignments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'goal_assignments', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (!prefsRef.current.notify_team_added) return;
          const row = payload.new;
          if (row?.self_assigned) return;
          notify("You've been invited to a goal", { body: `Role: ${row?.role ?? 'member'}` });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'goal_assignments' },
        async (payload: any) => {
          const row = payload.new;
          const old = payload.old || {};
          if (!row) return;
          // Fire only for the inviter, when the invitee acknowledges.
          if (row.acknowledged === true && old.acknowledged === false) {
            if (row.assigned_by !== user.id) return;
            if (!prefsRef.current.notify_assignment_response) return;
            notify('Invitation accepted', { body: `Someone accepted their goal invitation.` });
          }
          // Role change on someone's own assignment
          if (row.user_id === user.id && old.role && row.role && old.role !== row.role) {
            if (!prefsRef.current.notify_role_updates) return;
            notify('Your role changed', { body: `You are now a ${row.role} on a goal.` });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'goal_assignments' },
        (payload: any) => {
          if (!prefsRef.current.notify_assignment_response) return;
          const row = payload.old;
          if (!row) return;
          if (row.assigned_by !== user.id) return;
          if (row.acknowledged) return; // declined = deletion of a pending invite
          notify('Invitation declined', { body: 'Someone declined your goal invitation.' });
        }
      )
      .subscribe();

    const taskInvitationsChannel = supabase
      .channel('notif-daemon-task-invitations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_invitations', filter: `invitee_id=eq.${user.id}` },
        async (payload: any) => {
          if (!prefsRef.current.notify_team_added) return;
          const row = payload.new;
          if (!row || row.status !== 'pending') return;

          const { data: task } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', row.task_id)
            .maybeSingle();

          notify("You've been invited to support a task", {
            body: (task as any)?.title || 'Open notifications to accept or decline.',
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'task_invitations' },
        async (payload: any) => {
          if (!prefsRef.current.notify_assignment_response) return;
          const row = payload.new;
          const old = payload.old || {};
          if (!row || row.invited_by !== user.id || old.status === row.status) return;
          if (row.status !== 'accepted' && row.status !== 'declined') return;

          const { data: task } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', row.task_id)
            .maybeSingle();

          notify(row.status === 'accepted' ? 'Task invitation accepted' : 'Task invitation declined', {
            body: (task as any)?.title || 'Someone responded to your task invitation.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(outputsChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(taskInvitationsChannel);
    };
  }, [user?.id, isManagerOrAdmin, notify, prefsRef]);

  // Deadline check every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const checkDeadlines = async () => {
      if (!prefsRef.current.notify_deadline_1hr) return;

      const now = new Date();
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
        notify('Deadline approaching', { body: `${g.title} is due in less than an hour!` });
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
        notify('Deadline approaching', { body: `${t.title} is due in less than an hour!` });
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, DEADLINE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.id, notify, prefsRef]);
};
