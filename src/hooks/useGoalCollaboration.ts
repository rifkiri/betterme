import { useProductivity } from './useProductivity';
import { supabaseGoalAssignmentsService } from '@/services/SupabaseGoalAssignmentsService';
import { supabaseGoalNotificationsService } from '@/services/SupabaseGoalNotificationsService';
import { useState, useEffect } from 'react';
import { GoalAssignment, GoalNotification } from '@/types/productivity';

export const useGoalCollaboration = (userId: string) => {
  const [assignments, setAssignments] = useState<GoalAssignment[]>([]);
  const [notifications, setNotifications] = useState<GoalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAssignments = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const data = await supabaseGoalAssignmentsService.getGoalAssignments(userId);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading goal assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!userId) return;
    
    try {
      const data = await supabaseGoalNotificationsService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const createAssignment = async (assignment: Omit<GoalAssignment, 'id' | 'assignedDate'>) => {
    try {
      await supabaseGoalAssignmentsService.createGoalAssignment(assignment);
      
      // Create notification for the assigned user
      if (!assignment.selfAssigned) {
        await supabaseGoalNotificationsService.createNotification({
          userId: assignment.userId,
          goalId: assignment.goalId,
          notificationType: 'assignment',
          role: assignment.role
        });
      }
      
      // If self-assigned, notify managers
      if (assignment.selfAssigned) {
        // This would need to be implemented to notify coaches/leads
        await supabaseGoalNotificationsService.createNotification({
          userId: assignment.assignedBy, // The manager who created the goal
          goalId: assignment.goalId,
          notificationType: 'self_assignment',
          role: assignment.role
        });
      }
      
      await loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  };

  const acknowledgeNotification = async (notificationId: string) => {
    try {
      await supabaseGoalNotificationsService.acknowledgeNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  };

  const acknowledgeAllNotifications = async () => {
    try {
      await supabaseGoalNotificationsService.acknowledgeAllNotifications(userId);
      await loadNotifications();
    } catch (error) {
      console.error('Error acknowledging all notifications:', error);
    }
  };

  const joinWorkGoal = async (goalId: string) => {
    if (!userId) return;
    
    try {
      await createAssignment({
        goalId,
        userId,
        role: 'member',
        assignedBy: userId, // Self-assigned
        acknowledged: true,
        selfAssigned: true
      });
    } catch (error) {
      console.error('Error joining work goal:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userId) {
      loadAssignments();
      loadNotifications();
    }
  }, [userId]);

  return {
    assignments,
    notifications,
    isLoading,
    loadAssignments,
    loadNotifications,
    createAssignment,
    acknowledgeNotification,
    acknowledgeAllNotifications,
    joinWorkGoal
  };
};