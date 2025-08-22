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
  
  // Debug logging for authentication context
  console.log('Goals page - Profile:', profile ? { id: profile.id, name: profile.name, role: profile.role } : 'NO PROFILE');
  
  const {
    goals,
    allGoals,
    deletedGoals,
    habits,
    weeklyOutputs,
    loadAllData,
    addGoal,
    editGoal,
    updateGoalProgress,
    deleteGoal,
    restoreGoal,
    permanentlyDeleteGoal
  } = useProductivity();

  console.log('Goals page - Available goals for joining:', allGoals?.filter(goal => 
    goal.category === 'work' && 
    goal.progress < 100 && 
    !goal.archived && 
    goal.userId !== profile?.id &&
    !goal.memberIds?.includes(profile?.id || '') &&
    !goal.leadIds?.includes(profile?.id || '') &&
    goal.coachId !== profile?.id
  ).map(g => ({ id: g.id, title: g.title, userId: g.userId })));

  const {
    notifications,
    acknowledgeNotification,
    acknowledgeAllNotifications,
    joinWorkGoal,
    leaveWorkGoal
  } = useGoalCollaboration(profile?.id || '', loadAllData);

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
        onLeaveWorkGoal={leaveWorkGoal}
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