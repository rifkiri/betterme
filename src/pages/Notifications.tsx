import { useState, useEffect } from 'react';
import { AppNavigation } from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Bell } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Pending invitations (goal_assignments where acknowledged = false)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('goal_assignments')
        .select(`
          id,
          role,
          assigned_by,
          assigned_date,
          acknowledged,
          goals:goal_id ( id, title, description, category, user_id )
        `)
        .eq('user_id', user.id)
        .eq('acknowledged', false)
        .order('assigned_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch inviter profiles in one round-trip
      const inviterIds = Array.from(
        new Set(
          (assignmentsData || [])
            .map((a: any) => a.assigned_by || a.goals?.user_id)
            .filter(Boolean)
        )
      );
      let inviterMap: Record<string, { name: string; email: string }> = {};
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
        ...a,
        inviter: inviterMap[a.assigned_by] || inviterMap[a.goals?.user_id] || null,
      }));
      setInvitations(enriched);

      // 2. General notifications
      const { data: notifData, error: notifError } = await supabase
        .from('goal_notifications')
        .select('id, notification_type, role, acknowledged, created_date, goal_id, goals:goal_id ( title )')
        .eq('user_id', user.id)
        .order('created_date', { ascending: false })
        .limit(20);

      if (notifError) throw notifError;
      setNotifications(notifData || []);
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

  const handleAccept = async (assignmentId: string, goalTitle: string) => {
    try {
      const { error } = await supabase
        .from('goal_assignments')
        .update({ acknowledged: true })
        .eq('id', assignmentId);

      if (error) throw error;
      toast.success(`Accepted invitation to "${goalTitle}"`);
      loadData();
    } catch (err) {
      console.error('Error accepting assignment:', err);
      toast.error('Failed to accept invitation');
    }
  };

  const handleDecline = async (assignmentId: string, goalTitle: string) => {
    try {
      const { error } = await supabase
        .from('goal_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      toast.info(`Declined invitation to "${goalTitle}"`);
      loadData();
    } catch (err) {
      console.error('Error declining assignment:', err);
      toast.error('Failed to decline invitation');
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '';
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Manage your invitations and alerts</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* INVITATIONS */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                Pending Invitations
                {invitations.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {invitations.length}
                  </span>
                )}
              </h2>

              {invitations.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-muted-foreground">No pending invitations</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {invitations.map((inv) => (
                    <Card key={inv.id} className="overflow-hidden border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{inv.goals?.title || 'Unknown Goal'}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{inv.role || 'member'}</Badge>
                          {inv.inviter && (
                            <span className="text-xs">
                              Invited by <span className="font-medium">{inv.inviter.name}</span>
                            </span>
                          )}
                          <span className="text-xs">• {formatDate(inv.assigned_date)}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {inv.goals?.description || 'No description provided.'}
                        </p>
                      </CardContent>
                      <CardFooter className="bg-muted/30 flex justify-end space-x-2 pt-3 pb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecline(inv.id, inv.goals?.title || 'invitation')}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(inv.id, inv.goals?.title || 'invitation')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* GENERAL NOTIFICATIONS */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              {notifications.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-muted-foreground">No recent activity</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className="p-4 bg-card rounded-lg border shadow-sm flex justify-between items-start"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {(notif.notification_type || 'update').replace(/_/g, ' ')}
                          {notif.goals?.title ? ` — ${notif.goals.title}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notif.created_date)}
                        </p>
                      </div>
                      {!notif.acknowledged && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
