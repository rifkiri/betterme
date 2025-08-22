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

  // Enhanced debug logging for data flow
  console.log('Goals page - Raw data check:', {
    profileExists: !!profile,
    profile: profile ? { id: profile.id, name: profile.name, role: profile.role } : 'NO PROFILE',
    allGoalsCount: allGoals.length,
    allGoalsCategories: allGoals.map(g => ({ id: g.id, title: g.title, category: g.category, userId: g.userId })),
    currentUserId: profile?.id
  });

  // Debug the filtering logic step by step
  const workGoals = allGoals.filter(goal => goal.category === 'work');
  const activeWorkGoals = workGoals.filter(goal => goal.progress < 100 && !goal.archived);
  const otherUsersGoals = activeWorkGoals.filter(goal => goal.userId !== profile?.id);
  const notMemberGoals = otherUsersGoals.filter(goal => !goal.memberIds?.includes(profile?.id || ''));
  const notLeadGoals = notMemberGoals.filter(goal => !goal.leadIds?.includes(profile?.id || ''));
  const finalFilteredGoals = notLeadGoals.filter(goal => goal.coachId !== profile?.id);

  console.log('Goals page - Filtering breakdown:', {
    totalGoals: allGoals.length,
    workGoals: workGoals.length,
    activeWorkGoals: activeWorkGoals.length,
    otherUsersGoals: otherUsersGoals.length,
    notMemberGoals: notMemberGoals.length,
    notLeadGoals: notLeadGoals.length,
    finalAvailableGoals: finalFilteredGoals.length,
    finalGoals: finalFilteredGoals.map(g => ({ id: g.id, title: g.title, userId: g.userId }))
  });

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