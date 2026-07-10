import { useState, useEffect } from 'react';
import { AppNavigation } from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
      // 1. Fetch pending invitations (goal_assignments with acknowledged=false)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('goal_assignments')
        .select(`
          *,
          goals:goal_id (
            id,
            title,
            description,
            category,
            created_by
          )
        `)
        .eq('user_id', user.id)
        .eq('acknowledged', false)
        .order('assignment_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setInvitations(assignmentsData || []);

      // 2. Fetch general notifications
      const { data: notifData, error: notifError } = await supabase
        .from('goal_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
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
      loadData(); // refresh list
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
      loadData(); // refresh list
    } catch (err) {
      console.error('Error declining assignment:', err);
      toast.error('Failed to decline invitation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppNavigation />
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500">Manage your invitations and alerts</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* INVITATIONS SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Pending Invitations 
                {invitations.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {invitations.length}
                  </span>
                )}
              </h2>
              
              {invitations.length === 0 ? (
                <Card className="bg-gray-50/50 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-gray-500">No pending invitations</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {invitations.map((inv) => (
                    <Card key={inv.id} className="overflow-hidden border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{inv.goals?.title || 'Unknown Task'}</CardTitle>
                        <CardDescription>
                          Invited as {inv.role || 'Member'} • {formatDistanceToNow(new Date(inv.assignment_date), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {inv.goals?.description || 'No description provided.'}
                        </p>
                      </CardContent>
                      <CardFooter className="bg-gray-50 flex justify-end space-x-2 pt-3 pb-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDecline(inv.id, inv.goals?.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleAccept(inv.id, inv.goals?.title)}
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

            {/* GENERAL NOTIFICATIONS SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {notifications.length === 0 ? (
                <Card className="bg-gray-50/50 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-gray-500">No recent activity</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 bg-white rounded-lg border shadow-sm flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notif.notification_type || 'Update'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.is_read && (
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
