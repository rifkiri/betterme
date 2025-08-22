import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Goal, GoalAssignment, GoalNotification } from '@/types/productivity';
import { toast } from 'sonner';

interface UseGoalRealtimeProps {
  userId?: string;
  onGoalUpdate?: () => void;
  onAssignmentUpdate?: () => void;
  onNotificationUpdate?: () => void;
}

export const useGoalRealtime = ({ 
  userId, 
  onGoalUpdate, 
  onAssignmentUpdate, 
  onNotificationUpdate 
}: UseGoalRealtimeProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef<any[]>([]);
  const isInitialLoad = useRef(true);

  const setupRealtimeSubscriptions = () => {
    if (!userId) return;

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptionsRef.current = [];

    // Goals subscription
    const goalsChannel = supabase
      .channel('goals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals'
        },
        (payload) => {
          console.log('Real-time goal update:', payload);
          
          // Show toast for relevant updates (not for initial load)
          if (!isInitialLoad.current) {
            if (payload.eventType === 'INSERT') {
              toast.success('New goal created');
            } else if (payload.eventType === 'UPDATE') {
              // Only show toast for significant updates like progress changes
              const oldRecord = payload.old;
              const newRecord = payload.new;
              if (oldRecord?.progress !== newRecord?.progress) {
                toast.info('Goal progress updated');
              }
            }
          }

          // Trigger callback
          if (onGoalUpdate) {
            setTimeout(() => onGoalUpdate(), 500);
          }
        }
      )
      .subscribe();

    // Goal assignments subscription
    const assignmentsChannel = supabase
      .channel('goal-assignments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_assignments'
        },
        (payload) => {
          console.log('Real-time goal assignment update:', payload);
          
          if (!isInitialLoad.current) {
            if (payload.eventType === 'INSERT') {
              toast.success('New goal assignment');
            } else if (payload.eventType === 'DELETE') {
              toast.info('Goal assignment removed');
            }
          }

          if (onAssignmentUpdate) {
            setTimeout(() => onAssignmentUpdate(), 500);
          }
        }
      )
      .subscribe();

    // Goal notifications subscription
    const notificationsChannel = supabase
      .channel('goal-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time goal notification update:', payload);
          
          if (!isInitialLoad.current) {
            if (payload.eventType === 'INSERT') {
              toast.info('New goal notification');
            }
          }

          if (onNotificationUpdate) {
            setTimeout(() => onNotificationUpdate(), 500);
          }
        }
      )
      .subscribe();

    subscriptionsRef.current = [goalsChannel, assignmentsChannel, notificationsChannel];
    
    // Set connected status after a short delay
    setTimeout(() => {
      setIsConnected(true);
      isInitialLoad.current = false;
    }, 1000);

    console.log('Goal real-time subscriptions set up for user:', userId);
  };

  useEffect(() => {
    if (userId) {
      setupRealtimeSubscriptions();
    }

    return () => {
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [userId]);

  return {
    isConnected
  };
};