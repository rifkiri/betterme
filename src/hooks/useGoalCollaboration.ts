import { supabaseGoalAssignmentsService } from '@/services/SupabaseGoalAssignmentsService';
import { supabaseGoalNotificationsService } from '@/services/SupabaseGoalNotificationsService';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { GoalAssignment, GoalNotification } from '@/types/productivity';
import { toast } from 'sonner';

export const useGoalCollaboration = (userId: string, loadAllData?: () => Promise<void>) => {
  const [assignments, setAssignments] = useState<GoalAssignment[]>([]);
  const [notifications, setNotifications] = useState<GoalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debug authentication context
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('useGoalCollaboration auth check:', { 
        userId, 
        authUser: user?.id, 
        authError: error,
        match: userId === user?.id 
      });
    };
    checkAuth();
  }, [userId]);

  const loadAssignments = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      // Load ALL assignments to show team members in goal details
      const data = await supabaseGoalAssignmentsService.getAllGoalAssignments();
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
      console.log('createAssignment called with:', assignment);
      
      // Ensure user is authenticated before creating assignment
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required to create assignment');
      }
      
      console.log('Authentication verified:', user.id);
      
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
    console.log('joinWorkGoal called with:', { goalId, role, userId });
    
    if (!userId) {
      console.error('joinWorkGoal: No userId provided');
      toast.error('Authentication required to join goal');
      return;
    }
    
    try {
      console.log('Step 1: Getting goal data...');
      // First, get the goal to find its creator for notifications
      const { supabaseGoalsService } = await import('@/services/SupabaseGoalsService');
      const allGoals = await supabaseGoalsService.getAllGoals();
      const goal = allGoals.find(g => g.id === goalId);
      
      console.log('Step 1 result:', { goal: goal ? { id: goal.id, title: goal.title, userId: goal.userId } : 'NOT FOUND' });
      
      if (!goal) {
        throw new Error('Goal not found');
      }
      
      console.log('Step 2: Checking existing assignments...');
      // Check if user already has an assignment to this goal
      const userAssignments = await supabaseGoalAssignmentsService.getGoalAssignments(userId);
      const existingAssignment = userAssignments.find(
        assignment => assignment.goalId === goalId
      );
      
      console.log('Step 2 result:', { 
        userAssignmentsCount: userAssignments.length, 
        existingAssignment: existingAssignment ? { id: existingAssignment.id, role: existingAssignment.role } : 'NONE' 
      });
      
      // If user already has an assignment, delete it first (role switching)
      if (existingAssignment) {
        console.log('Step 3a: Deleting existing assignment...');
        await supabaseGoalAssignmentsService.deleteGoalAssignment(existingAssignment.id);
        console.log('Step 3a result: Existing assignment deleted');
      }
      
      console.log('Step 4: Creating new assignment...');
      // Create new assignment with selected role
      const assignmentData = {
        goalId,
        userId,
        role,
        assignedBy: userId, // Self-assigned
        acknowledged: true,
        selfAssigned: true
      };
      
      console.log('Step 4 data:', assignmentData);
      
      await createAssignment(assignmentData, goal.userId); // Pass goal creator ID for notification
      
      console.log('Step 4 result: Assignment created successfully');
      
      console.log('Step 5: Refreshing data...');
      // Refresh goals data to show the newly joined goal
      if (loadAllData) {
        await loadAllData();
      }
      
      const actionText = existingAssignment ? `switched to ${role}` : `joined goal as ${role}`;
      console.log('Step 6: Success!', actionText);
      toast.success(`Successfully ${actionText}`);
    } catch (error) {
      console.error('Error joining work goal:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      toast.error(`Failed to join goal: ${error?.message || 'Unknown error'}`);
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
      
      // Set up real-time listeners for goal assignments
      const assignmentsChannel = supabase
        .channel('goal-assignments-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'goal_assignments'
          },
          (payload) => {
            console.log('🚀 [REALTIME] Goal assignment changed:', payload);
            // Reload assignments when any assignment changes
            loadAssignments();
            // Also refresh goals data to update role displays
            if (loadAllData) {
              loadAllData();
            }
          }
        )
        .subscribe();

      // Set up real-time listeners for goal notifications
      const notificationsChannel = supabase
        .channel('goal-notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goal_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔔 [REALTIME] Goal notification changed:', payload);
            loadNotifications();
          }
        )
        .subscribe();

      // Cleanup function
      return () => {
        supabase.removeChannel(assignmentsChannel);
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [userId, loadAllData]);

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