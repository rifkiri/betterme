/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X, Target, ListChecks, Inbox, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { invalidateProductivityCache } from '@/hooks/useProductivityData';

interface Invitation {
  id: string;
  kind: 'goal' | 'task';
  title: string;
  role?: string;
  date: string;
  inviterName?: string;
}

interface NotificationBellProps {
  pendingCount: number;
  onChanged?: () => void;
}

export const NotificationBell = ({ pendingCount, onChanged }: NotificationBellProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: goalData }, { data: taskData }] = await Promise.all([
        supabase
          .from('goal_assignments')
          .select('id, role, assigned_by, assigned_date, goals:goal_id(title, user_id)')
          .eq('user_id', user.id)
          .eq('acknowledged', false)
          .order('assigned_date', { ascending: false })
          .limit(10),
        (supabase as any)
          .from('task_invitations')
          .select('id, invited_by, created_at, tasks:task_id(title, user_id)')
          .eq('invitee_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const inviterIds = Array.from(new Set([
        ...(goalData || []).map((g: any) => g.assigned_by || g.goals?.user_id),
        ...(taskData || []).map((t: any) => t.invited_by || t.tasks?.user_id),
      ].filter(Boolean)));

      const inviterMap: Record<string, string> = {};
      if (inviterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', inviterIds);
        (profiles || []).forEach((p: any) => (inviterMap[p.id] = p.name));
      }

      const items: Invitation[] = [
        ...(goalData || []).map((g: any) => ({
          id: g.id,
          kind: 'goal' as const,
          title: g.goals?.title || 'Untitled goal',
          role: g.role,
          date: g.assigned_date,
          inviterName: inviterMap[g.assigned_by] || inviterMap[g.goals?.user_id],
        })),
        ...(taskData || []).map((t: any) => ({
          id: t.id,
          kind: 'task' as const,
          title: t.tasks?.title || 'Untitled task',
          role: 'supporter',
          date: t.created_at,
          inviterName: inviterMap[t.invited_by] || inviterMap[t.tasks?.user_id],
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setInvitations(items);
    } catch (e) {
      console.error('NotificationBell load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const handleAccept = async (inv: Invitation) => {
    try {
      if (inv.kind === 'goal') {
        const { error } = await supabase
          .from('goal_assignments')
          .update({ acknowledged: true })
          .eq('id', inv.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).rpc('accept_task_invitation', { p_invitation_id: inv.id });
        if (error) throw error;
        invalidateProductivityCache(user?.id);
      }
      toast.success(`Accepted "${inv.title}"`);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to accept invitation');
    }
  };

  const handleDecline = async (inv: Invitation) => {
    try {
      if (inv.kind === 'goal') {
        const { error } = await supabase.from('goal_assignments').delete().eq('id', inv.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).rpc('decline_task_invitation', { p_invitation_id: inv.id });
        if (error) throw error;
        invalidateProductivityCache(user?.id);
      }
      toast.info(`Declined "${inv.title}"`);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to decline invitation');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative inline-flex items-center p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <motion.div
            animate={pendingCount > 0 ? { rotate: [0, -12, 10, -6, 4, 0] } : {}}
            transition={{ duration: 1.4, repeat: pendingCount > 0 ? Infinity : 0, repeatDelay: 2 }}
            style={{ transformOrigin: 'top center' }}
          >
            <Bell className="h-5 w-5" />
          </motion.div>
          <AnimatePresence>
            {pendingCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-destructive to-[hsl(0_84%_50%)] text-destructive-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background animate-soft-pulse"
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] flex items-center justify-center shadow-glow">
              <Bell className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Notifications</p>
              <p className="text-[11px] text-muted-foreground">
                {invitations.length > 0 ? `${invitations.length} pending` : 'You\'re all caught up'}
              </p>
            </div>
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No pending invitations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Assignments will appear here in real time.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              <AnimatePresence initial={false}>
                {invitations.map((inv) => {
                  const Icon = inv.kind === 'goal' ? Target : ListChecks;
                  return (
                    <motion.li
                      key={`${inv.kind}-${inv.id}`}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                            inv.kind === 'goal'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">{inv.title}</p>
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                              {inv.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {inv.inviterName ? `From ${inv.inviterName} • ` : ''}
                            {formatDistanceToNow(new Date(inv.date), { addSuffix: true })}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs"
                              onClick={() => handleAccept(inv)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => handleDecline(inv)}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/40 border-t border-border/60 transition-colors"
        >
          Open notifications center
        </Link>
      </PopoverContent>
    </Popover>
  );
};
