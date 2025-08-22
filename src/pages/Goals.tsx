import React, { useEffect } from 'react';
import { useGoalRealtime } from '@/hooks/useGoalRealtime';
import { AppNavigation } from '@/components/AppNavigation';
import { EnhancedGoalsSection } from '@/components/EnhancedGoalsSection';
import { GoalNotificationsDialog } from '@/components/GoalNotificationsDialog';
import { useProductivity } from '@/hooks/useProductivity';
import { useGoalCollaboration } from '@/hooks/useGoalCollaboration';
import { useUsersData } from '@/hooks/useUsersData';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const Goals = () => {
  useAuthGuard();
  
  const { profile } = useUserProfile();
  const { users, loadUsers } = useUsersData();
  
  // Debug logging for authentication context
  console.log('Goals page - Profile:', profile ? { id: profile.id, name: profile.name, role: profile.role } : 'NO PROFILE');
  
  const {
    goals,
    allGoals,
    deletedGoals,
    habits,
    tasks,
    weeklyOutputs,
    loadAllData,
    addGoal,
    editGoal,
    updateGoalProgress,
    deleteGoal,
    restoreGoal,
    permanentlyDeleteGoal
  } = useProductivity();

  const {
    assignments,
    notifications,
    acknowledgeNotification,
    acknowledgeAllNotifications,
    joinWorkGoal,
    leaveWorkGoal
  } = useGoalCollaboration(profile?.id || '', loadAllData);

  // Set up real-time updates for goals  
  useGoalRealtime({
    userId: profile?.id,
    onGoalUpdate: () => {
      loadAllData();
    },
    onAssignmentUpdate: () => {
      loadAllData();
    },
    onNotificationUpdate: () => {
      // Notifications are handled by the collaboration hook
    }
  });

  // Set page title and load users
  useEffect(() => {
    document.title = "My Goals - BetterMe";
    
    // Load users for goal role assignments (all roles can see appropriate users)
    loadUsers();
    
    // Cleanup: restore original title when leaving the page
    return () => {
      document.title = "BetterMe";
    };
  }, [profile?.role]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <EnhancedGoalsSection 
        goals={goals}
        allGoals={allGoals}
        deletedGoals={deletedGoals}
        habits={habits}
        tasks={tasks}
        weeklyOutputs={weeklyOutputs}
        availableUsers={users}
        currentUserId={profile?.id}
        userRole={profile?.role}
        assignments={assignments}
        onAddGoal={addGoal}
        onEditGoal={editGoal}
        onDeleteGoal={deleteGoal}
        onRestoreGoal={restoreGoal}
        onPermanentlyDeleteGoal={permanentlyDeleteGoal}
        onUpdateGoalProgress={updateGoalProgress}
        onJoinWorkGoal={joinWorkGoal}
        onLeaveWorkGoal={leaveWorkGoal}
        onRefresh={loadAllData}
      />

      {/* Goal Notifications */}
      <GoalNotificationsDialog
        notifications={notifications}
        goals={goals}
        onAcknowledge={acknowledgeNotification}
        onAcknowledgeAll={acknowledgeAllNotifications}
      />
    </div>
  );
};

export default Goals;