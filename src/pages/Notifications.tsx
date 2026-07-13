/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { AppNavigation } from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Bell, Inbox, Target, ListChecks, Sparkles, Clock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invalidateProductivityCache } from '@/hooks/useProductivityData';

type TabKey = 'all' | 'invitations' | 'activity';

export default function Notifications() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('goal_assignments')
        .select(`
          id, role, assigned_by, assigned_date, acknowledged,
          goals:goal_id ( id, title, description, category, user_id )
        `)
        .eq('user_id', user.id)
        .eq('acknowledged', false)
        .order('assigned_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      const inviterIds = Array.from(
        new Set(
          (assignmentsData || [])
            .map((a: any) => a.assigned_by || a.goals?.user_id)
            .filter(Boolean)
        )
      );
      const inviterMap: Record<string, { name: string; email: string }> = {};
      if (inviterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', inviterIds);
        (profiles || []).forEach((p: any) => {
          inviterMap[p.id] = { name: p.name, email: p.email };
        });
      }

      const enriched = (assignmentsData || []).map((a: any) => ({
        type: 'goal',
        ...a,
        title: a.goals?.title || 'Unknown Goal',
        description: a.goals?.description || 'No description provided.',
        date: a.assigned_date,
        badge: a.role || 'member',
        inviter: inviterMap[a.assigned_by] || inviterMap[a.goals?.user_id] || null,
      }));

      const { data: taskInvitationsData, error: taskInvitationsError } = await (supabase as any)
        .from('task_invitations')
        .select(`
          id, task_id, invited_by, status, created_at,
          tasks:task_id ( id, title, description, user_id, due_date, priority )
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (taskInvitationsError) throw taskInvitationsError;

      const taskInviterIds = Array.from(
        new Set<string>(
          (taskInvitationsData || [])
            .map((inv: any) => inv.invited_by || inv.tasks?.user_id)
            .filter((id: unknown): id is string => typeof id === 'string')
        )
      );
      if (taskInviterIds.length > 0) {
        const missing = taskInviterIds.filter((id) => !inviterMap[id]);
        if (missing.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', missing);
          (profiles || []).forEach((p: any) => {
            inviterMap[p.id] = { name: p.name, email: p.email };
          });
        }
      }

      const enrichedTasks = (taskInvitationsData || []).map((inv: any) => ({
        type: 'task',
        ...inv,
        title: inv.tasks?.title || 'Unknown Task',
        description: inv.tasks?.description || 'No description provided.',
        date: inv.created_at,
        badge: 'supporter',
        inviter: inviterMap[inv.invited_by] || inviterMap[inv.tasks?.user_id] || null,
      }));

      setInvitations([...enriched, ...enrichedTasks].sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      ));

      const { data: notifData, error: notifError } = await supabase
        .from('goal_notifications')
        .select('id, notification_type, role, acknowledged, created_date, goal_id')
        .eq('user_id', user.id)
        .order('created_date', { ascending: false })
        .limit(20);

      if (notifError) throw notifError;

      const notificationGoalIds = Array.from(new Set((notifData || []).map((n) => n.goal_id).filter(Boolean)));
      const notificationGoalMap: Record<string, { title: string }> = {};
      if (notificationGoalIds.length > 0) {
        const { data: goals } = await supabase
          .from('goals')
          .select('id, title')
          .in('id', notificationGoalIds);
        (goals || []).forEach((goal) => {
          notificationGoalMap[goal.id] = { title: goal.title };
        });
      }

      setNotifications((notifData || []).map((notif) => ({
        ...notif,
        goals: notif.goal_id ? notificationGoalMap[notif.goal_id] : null,
      })));
    } catch (err) {
      console.error('Error loading notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAccept = async (id: string, title: string) => {
    try {
      const { error } = await supabase.from('goal_assignments').update({ acknowledged: true }).eq('id', id);
      if (error) throw error;
      toast.success(`Accepted invitation to "${title}"`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept invitation');
    }
  };

  const handleAcceptTask = async (id: string, title: string) => {
    try {
      const { error } = await (supabase as any).rpc('accept_task_invitation', { p_invitation_id: id });
      if (error) throw error;
      invalidateProductivityCache(user?.id);
      toast.success(`Accepted invitation to "${title}"`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept task invitation');
    }
  };

  const handleDecline = async (id: string, title: string) => {
    try {
      const { error } = await supabase.from('goal_assignments').delete().eq('id', id);
      if (error) throw error;
      toast.info(`Declined invitation to "${title}"`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to decline invitation');
    }
  };

  const handleDeclineTask = async (id: string, title: string) => {
    try {
      const { error } = await (supabase as any).rpc('decline_task_invitation', { p_invitation_id: id });
      if (error) throw error;
      invalidateProductivityCache(user?.id);
      toast.info(`Declined invitation to "${title}"`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to decline task invitation');
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '';
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
    catch { return ''; }
  };

  const showInvitations = tab === 'all' || tab === 'invitations';
  const showActivity = tab === 'all' || tab === 'activity';

  const tabs = useMemo(() => ([
    { key: 'all' as TabKey, label: 'All', count: invitations.length + notifications.length },
    { key: 'invitations' as TabKey, label: 'Invitations', count: invitations.length },
    { key: 'activity' as TabKey, label: 'Activity', count: notifications.length },
  ]), [invitations.length, notifications.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] gradient-hero -z-0" />

      <main className="relative flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] shadow-glow flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary-foreground" />
              </div>
              {invitations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive ring-2 ring-background animate-soft-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Stay on top of invitations and activity across your workspace
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 p-1 rounded-xl bg-muted/60 backdrop-blur w-fit border border-border/50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="notif-tab-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] shadow-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
                    tab === t.key ? 'bg-primary-foreground/25 text-primary-foreground' : 'bg-foreground/10 text-foreground'
                  }`}>
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="h-full w-full shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {showInvitations && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pending Invitations
                  </h2>
                  {invitations.length > 0 && (
                    <span className="text-xs text-muted-foreground">{invitations.length} awaiting response</span>
                  )}
                </div>

                {invitations.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="h-6 w-6" />}
                    title="You're all caught up"
                    subtitle="No pending invitations right now."
                  />
                ) : (
                  <div className="grid gap-3">
                    <AnimatePresence initial={false}>
                      {invitations.map((inv, i) => (
                        <InvitationCard
                          key={inv.id}
                          inv={inv}
                          index={i}
                          onAccept={() => inv.type === 'task'
                            ? handleAcceptTask(inv.id, inv.title)
                            : handleAccept(inv.id, inv.title)}
                          onDecline={() => inv.type === 'task'
                            ? handleDeclineTask(inv.id, inv.title)
                            : handleDecline(inv.id, inv.title)}
                          formatDate={formatDate}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {showActivity && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Recent Activity
                  </h2>
                </div>

                {notifications.length === 0 ? (
                  <EmptyState
                    icon={<Bell className="h-6 w-6" />}
                    title="No recent activity"
                    subtitle="Updates on goals you follow will show up here."
                  />
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur overflow-hidden divide-y divide-border/50">
                    {notifications.map((notif: any, i) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                          !notif.acknowledged
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Target className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">
                            {(notif.notification_type || 'update').replace(/_/g, ' ')}
                            {notif.goals?.title && (
                              <span className="text-muted-foreground font-normal"> — {notif.goals.title}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(notif.created_date)}</p>
                        </div>
                        {!notif.acknowledged && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-soft-pulse" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function InvitationCard({
  inv, index, onAccept, onDecline, formatDate,
}: {
  inv: any; index: number;
  onAccept: () => void; onDecline: () => void;
  formatDate: (d: string) => string;
}) {
  const Icon = inv.type === 'task' ? ListChecks : Target;
  const accent = inv.type === 'task'
    ? 'from-[hsl(280_90%_65%)] to-[hsl(260_90%_60%)]'
    : 'from-primary to-[hsl(var(--primary-glow))]';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.98 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft hover:shadow-elevated transition-shadow"
    >
      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${accent}`} />
      <div className="p-5 pl-6">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-soft`}>
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary" className="capitalize text-[10px] font-medium">
                {inv.type} · {inv.badge}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />{formatDate(inv.date)}
              </span>
            </div>
            <h3 className="font-display font-semibold text-base leading-snug text-foreground">
              {inv.title}
            </h3>
            {inv.inviter && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <UserIcon className="h-3 w-3" />
                Invited by <span className="font-medium text-foreground">{inv.inviter.name}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{inv.description}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDecline}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-1" /> Decline
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] hover:opacity-90 shadow-soft"
          >
            <Check className="w-4 h-4 mr-1" /> Accept
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-dashed border-border/70 bg-card/50 backdrop-blur p-12 text-center"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );
}
