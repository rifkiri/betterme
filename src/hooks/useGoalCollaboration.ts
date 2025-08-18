import { supabaseGoalAssignmentsService } from '@/services/SupabaseGoalAssignmentsService';
import { supabaseGoalNotificationsService } from '@/services/SupabaseGoalNotificationsService';
import { useState, useEffect } from 'react';
import { GoalAssignment, GoalNotification } from '@/types/productivity';
import { toast } from 'sonner';

export const useGoalCollaboration = (userId: string, loadAllData?: () => Promise<void>) => {
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

  const createAssignment = async (assignment: Omit<GoalAssignment, 'id' | 'assignedDate'>, goalCreatorId?: string) => {
    try {
      await supabaseGoalAssignmentsService.createGoalAssignment(assignment);
      
      // Create notification for the assigned user (when manager assigns)
      if (!assignment.selfAssigned) {
        await supabaseGoalNotificationsService.createNotification({
          userId: assignment.userId,
          goalId: assignment.goalId,
          notificationType: 'assignment',
          role: assignment.role
        });
      }
      
      // If self-assigned, notify goal creator
      if (assignment.selfAssigned && goalCreatorId) {
        await supabaseGoalNotificationsService.createNotification({
          userId: goalCreatorId, // The goal creator
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

  const joinWorkGoal = async (goalId: string, role: 'coach' | 'lead' | 'member' = 'member') => {
    if (!userId) return;
    
    try {
      // First, get the goal to find its creator for notifications
      const { supabaseGoalsService } = await import('@/services/SupabaseGoalsService');
      const allGoals = await supabaseGoalsService.getAllGoals();
      const goal = allGoals.find(g => g.id === goalId);
      
      if (!goal) {
        throw new Error('Goal not found');
      }
      
      // Check if user already has an assignment to this goal
      const userAssignments = await supabaseGoalAssignmentsService.getGoalAssignments(userId);
      const existingAssignment = userAssignments.find(
        assignment => assignment.goalId === goalId
      );
      
      // If user already has an assignment, delete it first (role switching)
      if (existingAssignment) {
        await supabaseGoalAssignmentsService.deleteGoalAssignment(existingAssignment.id);
      }
      
      // Create new assignment with selected role
      await createAssignment({
        goalId,
        userId,
        role,
        assignedBy: userId, // Self-assigned
        acknowledged: true,
        selfAssigned: true
      }, goal.userId); // Pass goal creator ID for notification
      
      // Refresh goals data to show the newly joined goal
      if (loadAllData) {
        await loadAllData();
      }
      
      const actionText = existingAssignment ? `switched to ${role}` : `joined goal as ${role}`;
      toast.success(`Successfully ${actionText}`);
    } catch (error) {
      console.error('Error joining work goal:', error);
      toast.error('Failed to join goal');
      throw error;
    }
  };

  const leaveWorkGoal = async (goalId: string) => {
    if (!userId) return;
    
    try {
      // Query the database directly for the user's assignment to this goal
      const userAssignments = await supabaseGoalAssignmentsService.getGoalAssignments(userId);
      const userAssignment = userAssignments.find(
        assignment => assignment.goalId === goalId
      );
      
      if (!userAssignment) {
        toast.error('No assignment found for this goal');
        return;
      }
      
      // Delete the assignment
      await supabaseGoalAssignmentsService.deleteGoalAssignment(userAssignment.id);
      
      // Refresh assignments and goals data
      await loadAssignments();
      if (loadAllData) {
        await loadAllData();
      }
      
      toast.success('Successfully left the work goal');
    } catch (error) {
      console.error('Error leaving work goal:', error);
      toast.error('Failed to leave work goal');
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
    joinWorkGoal,
    leaveWorkGoal
  };
};