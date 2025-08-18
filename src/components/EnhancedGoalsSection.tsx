import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SimpleAddGoalDialog } from './SimpleAddGoalDialog';
import { JoinGoalDialog } from './JoinGoalDialog';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import { Goal, WeeklyOutput } from '@/types/productivity';
import { Target, Briefcase, User, Plus, CheckCircle, Minus, Edit, Trash2, Eye } from 'lucide-react';

interface EnhancedGoalsSectionProps {
  goals: Goal[];
  allGoals: Goal[];
  deletedGoals: Goal[];
  weeklyOutputs: WeeklyOutput[];
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  userRole?: string;
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'createdDate'>) => void;
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onRestoreGoal: (id: string) => void;
  onPermanentlyDeleteGoal: (id: string) => void;
  onUpdateGoalProgress: (goalId: string, progress: number) => void;
  onJoinWorkGoal: (goalId: string, role?: 'coach' | 'lead' | 'member') => void;
  onLeaveWorkGoal: (goalId: string) => void;
}

export const EnhancedGoalsSection = ({
  goals,
  allGoals,
  deletedGoals,
  weeklyOutputs,
  availableUsers = [],
  currentUserId,
  userRole,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onRestoreGoal,
  onPermanentlyDeleteGoal,
  onUpdateGoalProgress,
  onJoinWorkGoal,
  onLeaveWorkGoal
}: EnhancedGoalsSectionProps) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);

  // Filter goals by completion status instead of category
  const activeGoals = goals.filter(goal => goal.progress < 100 && !goal.archived);
  const completedGoals = goals.filter(goal => goal.progress >= 100);

  const isManager = userRole === 'manager' || userRole === 'admin';

  const getCategoryIcon = (category: 'work' | 'personal') => {
    return category === 'work' ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getCategoryColor = (category: 'work' | 'personal') => {
    return category === 'work' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getUserRole = (goal: Goal) => {
    if (!currentUserId) return null;
    
    if (goal.coachId === currentUserId) return 'Coach';
    if (goal.leadIds?.includes(currentUserId)) return 'Lead';
    if (goal.memberIds?.includes(currentUserId)) return 'Member';
    return null;
  };

  const renderGoalCard = (goal: Goal) => {
    const goalUserRole = getUserRole(goal);
    const progressColor = goal.progress >= 80 ? 'bg-green-500' : 
                         goal.progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500';
    
    // Debug logging
    console.log('Goal debug:', {
      goalId: goal.id,
      title: goal.title,
      category: goal.category,
      userId: goal.userId,
      currentUserId,
      goalUserRole,
      coachId: goal.coachId,
      leadIds: goal.leadIds,
      memberIds: goal.memberIds,
      createdBy: goal.createdBy
    });
    
    // Determine if user owns the goal or is just assigned to it
    const isGoalOwner = goal.userId === currentUserId;
    const isAssignedUser = goalUserRole && !isGoalOwner;
    const canManageGoal = isGoalOwner || isManager;
    
    // For work goals, show both Delete (if owner/manager) and Leave (if assigned) options
    const showLeaveOption = goal.category === 'work' && goalUserRole && (goal.memberIds?.includes(currentUserId!) || goal.leadIds?.includes(currentUserId!) || goal.coachId === currentUserId);
    const showDeleteOption = canManageGoal;

    return (
      <Card key={goal.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(goal.category)}
              <CardTitle className="text-lg">{goal.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getCategoryColor(goal.category)}>
                {goal.category === 'work' ? 'Work' : 'Personal'}
              </Badge>
              {goalUserRole && (
                <Badge variant="secondary" className="text-xs">
                  {goalUserRole}
                </Badge>
              )}
              {isGoalOwner && (
                <Badge variant="default" className="text-xs">
                  Owner
                </Badge>
              )}
            </div>
          </div>
          {goal.description && (
            <CardDescription>{goal.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${progressColor}`}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Goal Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Progress:</span>
              <span className="font-medium ml-1">
                {goal.progress}%
              </span>
            </div>
          </div>

          {goal.deadline && (
            <div className="text-sm">
              <span className="text-gray-500">Deadline:</span>
              <span className="font-medium ml-1">
                {goal.deadline.toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Work Goal Team Info */}
          {goal.category === 'work' && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Team Assignment</p>
              <div className="flex flex-wrap gap-1 text-xs">
                <span>Coach: {goal.coachId ? '1' : '0'}</span>
                <span>•</span>
                <span>Leads: {goal.leadIds?.length || 0}</span>
                <span>•</span>
                <span>Members: {goal.memberIds?.length || 0}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {/* View Details button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewingGoal(goal)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {/* Delete button - for goal owners and managers */}
            {showDeleteOption && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onDeleteGoal(goal.id)}
                title="Delete Goal"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {/* Leave Goal button - for work goals where user has a role */}
            {showLeaveOption && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onLeaveWorkGoal(goal.id)}
                className="text-orange-600 hover:bg-orange-50"
              >
                Leave Goal
              </Button>
            )}
            
            {/* Progress Controls - for all assigned users and owners */}
            {(goalUserRole || isGoalOwner) && (
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateGoalProgress(goal.id, goal.progress - 10)} 
                  disabled={goal.progress <= 0} 
                  className="h-8 w-8 p-0"
                  title="Decrease Progress"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateGoalProgress(goal.id, goal.progress + 10)} 
                  disabled={goal.progress >= 100} 
                  className="h-8 w-8 p-0"
                  title="Increase Progress"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {goal.progress !== 100 && (
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => onUpdateGoalProgress(goal.id, 100)} 
                    className="h-8 w-8 p-0"
                    title="Mark as Achieved"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-full mx-auto p-1 sm:p-2 lg:p-4">
        <div className="text-center mb-2 sm:mb-4 px-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            My Goals
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
            Track your personal and work goals, collaborate with your team
          </p>
        </div>

        {/* Tabs positioned below header subtitle like TeamDashboard */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'completed')}>
          <TabsList className="flex w-full h-auto p-1 bg-gray-100 rounded-lg overflow-x-auto mb-6">
            <TabsTrigger 
              value="active" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              Active ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Completed ({completedGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Active Goals</h3>
                  <p className="text-sm text-gray-600">Goals currently in progress</p>
                </div>
                <div className="flex gap-3">
                  <SimpleAddGoalDialog 
                    onAddGoal={onAddGoal} 
                    availableUsers={availableUsers}
                    currentUserId={currentUserId}
                  />
                  <JoinGoalDialog
                    availableGoals={allGoals.filter(goal => 
                      goal.category === 'work' && 
                      goal.progress < 100 && 
                      !goal.archived && 
                      goal.userId !== currentUserId &&
                      !goal.memberIds?.includes(currentUserId || '') &&
                      !goal.leadIds?.includes(currentUserId || '') &&
                      goal.coachId !== currentUserId
                    )}
                    availableUsers={availableUsers}
                    currentUserId={currentUserId}
                    onJoinGoal={(goalId, role) => onJoinWorkGoal(goalId, role)}
                  />
                </div>
              </div>
              
              {activeGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active goals yet</p>
                  <p className="text-sm mt-1">Create your first goal to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeGoals.map(renderGoalCard)}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Completed Goals</h3>
                <p className="text-sm text-gray-600">Goals that have been accomplished</p>
              </div>
              
              {completedGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No completed goals yet</p>
                  <p className="text-sm mt-1">Complete some goals to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedGoals.map(renderGoalCard)}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Details Dialog */}
      {viewingGoal && (
        <GoalDetailsDialog
          goal={viewingGoal}
          open={!!viewingGoal}
          onOpenChange={() => setViewingGoal(null)}
          onEditGoal={onEditGoal}
          onUpdateProgress={onUpdateGoalProgress}
          weeklyOutputs={weeklyOutputs}
          tasks={[]}
        />
      )}
    </div>
  );
};