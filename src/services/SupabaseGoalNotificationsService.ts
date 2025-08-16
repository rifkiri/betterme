import { supabase } from '@/integrations/supabase/client';
import { GoalNotification } from '@/types/productivity';

export class SupabaseGoalNotificationsService {
  async getNotifications(userId: string): Promise<GoalNotification[]> {
    console.log('Getting notifications for user:', userId);
    
    const { data, error } = await supabase
      .from('goal_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('acknowledged', false)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      goalId: notification.goal_id,
      notificationType: notification.notification_type as 'assignment' | 'self_assignment',
      role: notification.role as 'coach' | 'lead' | 'member',
      acknowledged: notification.acknowledged,
      createdDate: new Date(notification.created_date)
    }));
  }

  async createNotification(notification: Omit<GoalNotification, 'id' | 'createdDate' | 'acknowledged'>): Promise<void> {
    console.log('Creating notification:', notification);
    
    const { error } = await supabase
      .from('goal_notifications')
      .insert({
        user_id: notification.userId,
        goal_id: notification.goalId,
        notification_type: notification.notificationType,
        role: notification.role
      });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async acknowledgeNotification(id: string): Promise<void> {
    console.log('Acknowledging notification:', id);
    
    const { error } = await supabase
      .from('goal_notifications')
      .update({ acknowledged: true })
      .eq('id', id);

    if (error) {
      console.error('Error acknowledging notification:', error);
      throw error;
    }
  }

  async acknowledgeAllNotifications(userId: string): Promise<void> {
    console.log('Acknowledging all notifications for user:', userId);
    
    const { error } = await supabase
      .from('goal_notifications')
      .update({ acknowledged: true })
      .eq('user_id', userId)
      .eq('acknowledged', false);

    if (error) {
      console.error('Error acknowledging all notifications:', error);
      throw error;
    }
  }
}

export const supabaseGoalNotificationsService = new SupabaseGoalNotificationsService();