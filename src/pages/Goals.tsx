
import React, { useEffect } from 'react';
import { AppNavigation } from '@/components/AppNavigation';
import { EnhancedGoalsSection } from '@/components/EnhancedGoalsSection';
import { useProductivity } from '@/hooks/useProductivity';
import { useUsersData } from '@/hooks/useUsersData';
import { useUserProfile } from '@/hooks/useUserProfile';

const Goals = () => {
  const { profile } = useUserProfile();
  const { users, loadUsers } = useUsersData();
  
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

  // Simple join/leave functions for work goals (simplified from previous collaboration system)
  const joinWorkGoal = async (goalId: string) => {
    console.log('Join goal functionality simplified - goal:', goalId);
  };

  const leaveWorkGoal = async (goalId: string) => {
    console.log('Leave goal functionality simplified - goal:', goalId);
  };

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
    </div>
  );
};

export default Goals;
