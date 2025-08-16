import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EnhancedAddGoalDialog } from './EnhancedAddGoalDialog';
import { WorkGoalSelectionDialog } from './WorkGoalSelectionDialog';
import { Goal, WeeklyOutput } from '@/types/productivity';
import { Target, Briefcase, User, Plus, CheckCircle } from 'lucide-react';

interface EnhancedGoalsSectionProps {
  goals: Goal[];
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
  onJoinWorkGoal: (goalId: string) => void;
}

export const EnhancedGoalsSection = ({
  goals,
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
  onJoinWorkGoal
}: EnhancedGoalsSectionProps) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Filter goals by completion status instead of category
  const activeGoals = goals.filter(goal => goal.progress < 100 && !goal.archived);
  const completedGoals = goals.filter(goal => goal.progress >= 100);
  
  // Filter available work goals for joining
  const availableWorkGoals = goals.filter(goal => 
    goal.category === 'work' &&
    goal.progress < 100 &&
    !goal.memberIds?.includes(currentUserId || '') &&
    !goal.leadIds?.includes(currentUserId || '') &&
    goal.coachId !== currentUserId
  );

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
    const userRole = getUserRole(goal);
    const progressColor = goal.progress >= 80 ? 'bg-green-500' : 
                         goal.progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500';

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
              {userRole && (
                <Badge variant="secondary" className="text-xs">
                  {userRole}
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
              <span className="text-gray-500">Current:</span>
              <span className="font-medium ml-1">
                {goal.currentValue} {goal.unit}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Target:</span>
              <span className="font-medium ml-1">
                {goal.targetValue} {goal.unit}
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
            <Button variant="outline" size="sm" onClick={() => onEditGoal(goal.id, {})}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDeleteGoal(goal.id)}>
              Delete
            </Button>
            {goal.category === 'work' && userRole && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onUpdateGoalProgress(goal.id, goal.progress + 10)}
              >
                Update Progress
              </Button>
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
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Target className="h-3 w-3" />
                Active ({activeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Completed ({completedGoals.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {/* Role-based button display */}
              {isManager && (
                <EnhancedAddGoalDialog
                  onAddGoal={onAddGoal}
                  weeklyOutputs={weeklyOutputs}
                  availableUsers={availableUsers}
                  currentUserId={currentUserId}
                  userRole={userRole}
                />
              )}
              {availableWorkGoals.length > 0 && (
                <WorkGoalSelectionDialog
                  availableGoals={availableWorkGoals}
                  onSelectGoal={onJoinWorkGoal}
                />
              )}
            </div>
          </div>

          <TabsContent value="active" className="space-y-4">
            {/* Add Goal button only shows in active section for non-managers */}
            {!isManager && (
              <div className="mb-4">
                <EnhancedAddGoalDialog
                  onAddGoal={onAddGoal}
                  weeklyOutputs={weeklyOutputs}
                  availableUsers={availableUsers}
                  currentUserId={currentUserId}
                  userRole={userRole}
                />
              </div>
            )}
            
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
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};