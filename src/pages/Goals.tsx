import React, { useEffect } from 'react';
import { AppNavigation } from '@/components/AppNavigation';
import { EnhancedGoalsSection } from '@/components/EnhancedGoalsSection';
import { GoalNotificationsDialog } from '@/components/GoalNotificationsDialog';
import { useProductivity } from '@/hooks/useProductivity';
import { useGoalCollaboration } from '@/hooks/useGoalCollaboration';
import { useUsersData } from '@/hooks/useUsersData';
import { useUserProfile } from '@/hooks/useUserProfile';

const Goals = () => {
  const { profile } = useUserProfile();
  const { users, loadUsers } = useUsersData();
  
  const {
    goals,
    deletedGoals,
    weeklyOutputs,
    addGoal,
    editGoal,
    updateGoalProgress,
    deleteGoal,
    restoreGoal,
    permanentlyDeleteGoal
  } = useProductivity();

  const {
    notifications,
    acknowledgeNotification,
    acknowledgeAllNotifications,
    joinWorkGoal
  } = useGoalCollaboration(profile?.id || '');

  // Set page title and load users
  useEffect(() => {
    document.title = "My Goals - BetterMe";
    
    // Load users for goal role assignments
    if (profile?.role === 'manager' || profile?.role === 'admin') {
      loadUsers();
    }
    
    // Cleanup: restore original title when leaving the page
    return () => {
      document.title = "BetterMe";
    };
  }, [profile?.role]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Goals</h1>
          <p className="text-gray-600">Track your personal and work objectives</p>
        </div>
        
        <EnhancedGoalsSection 
          goals={goals}
          deletedGoals={deletedGoals}
          weeklyOutputs={weeklyOutputs}
          availableUsers={users}
          currentUserId={profile?.id}
          userRole={profile?.role}
          onAddGoal={addGoal}
          onEditGoal={editGoal}
          onDeleteGoal={deleteGoal}
          onRestoreGoal={restoreGoal}
          onPermanentlyDeleteGoal={permanentlyDeleteGoal}
          onUpdateGoalProgress={updateGoalProgress}
          onJoinWorkGoal={joinWorkGoal}
        />

        {/* Goal Notifications */}
        <GoalNotificationsDialog
          notifications={notifications}
          goals={goals}
          onAcknowledge={acknowledgeNotification}
          onAcknowledgeAll={acknowledgeAllNotifications}
        />
      </div>
    </div>
  );
};

export default Goals;