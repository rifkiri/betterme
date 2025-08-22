import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalForm } from './GoalForm';
import { GoalCard } from './GoalCard';
import { LinkGoalsDialog } from './LinkGoalsDialog';
import { Plus, Target, Archive, Trash2, Users, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { Goal, Habit, WeeklyOutput } from '@/types/productivity';

interface EnhancedGoalsSectionProps {
  goals: Goal[];
  allGoals: Goal[];
  deletedGoals: Goal[];
  habits: Habit[];
  weeklyOutputs: WeeklyOutput[];
  availableUsers: any[];
  currentUserId?: string;
  userRole?: string;
  onAddGoal: (goal: any) => Promise<void>;
  onEditGoal: (id: string, updates: any) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onRestoreGoal: (id: string) => Promise<void>;
  onPermanentlyDeleteGoal: (id: string) => Promise<void>;
  onUpdateGoalProgress: (id: string, progress: number) => Promise<void>;
  onJoinWorkGoal?: (goalId: string) => Promise<void>;
  onLeaveWorkGoal?: (goalId: string) => Promise<void>;
}

export const EnhancedGoalsSection = ({
  goals,
  allGoals,
  deletedGoals,
  habits,
  weeklyOutputs,
  availableUsers,
  currentUserId,
  userRole,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onRestoreGoal,
  onPermanentlyDeleteGoal,
  onUpdateGoalProgress,
  onJoinWorkGoal,
  onLeaveWorkGoal,
}: EnhancedGoalsSectionProps) => {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('active');

  // Filter goals based on user role and permissions
  const filteredGoals = useMemo(() => {
    if (userRole === 'admin') {
      return allGoals.filter(goal => !goal.isDeleted);
    }
    
    if (userRole === 'manager') {
      return allGoals.filter(goal => 
        !goal.isDeleted && (
          goal.userId === currentUserId ||
          goal.coachId === currentUserId ||
          goal.leadIds?.includes(currentUserId!) ||
          goal.memberIds?.includes(currentUserId!)
        )
      );
    }
    
    // Team members see their own goals and goals they're assigned to
    return goals.filter(goal => !goal.isDeleted);
  }, [goals, allGoals, userRole, currentUserId]);

  const activeGoals = filteredGoals.filter(goal => !goal.completed && !goal.archived);
  const completedGoals = filteredGoals.filter(goal => goal.completed);
  const archivedGoals = filteredGoals.filter(goal => goal.archived);

  const handleAddGoal = async (goalData: any) => {
    try {
      await onAddGoal(goalData);
      setShowGoalForm(false);
      toast.success('Goal created successfully');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleEditGoal = async (goalData: any) => {
    if (!editingGoal) return;
    
    try {
      await onEditGoal(editingGoal.id, goalData);
      setEditingGoal(null);
      toast.success('Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const handleJoinGoal = (goalId: string) => {
    onJoinWorkGoal?.(goalId);
  };

  const handleLeaveGoal = (goalId: string) => {
    onLeaveWorkGoal?.(goalId);
  };

  const canCreateGoals = userRole === 'admin' || userRole === 'manager';
  const canManageAllGoals = userRole === 'admin';

  const renderGoalsList = (goalsList: Goal[], showActions = true) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {goalsList.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          habits={habits}
          weeklyOutputs={weeklyOutputs}
          availableUsers={availableUsers}
          currentUserId={currentUserId}
          userRole={userRole}
          onEdit={showActions ? (goal) => setEditingGoal(goal) : undefined}
          onDelete={showActions ? onDeleteGoal : undefined}
          onUpdateProgress={onUpdateGoalProgress}
          onLinkGoals={(goalId) => setLinkingGoalId(goalId)}
          onJoinGoal={handleJoinGoal}
          onLeaveGoal={handleLeaveGoal}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Goals</h1>
          <p className="text-gray-600">Track and manage your personal and professional objectives</p>
        </div>
        
        {canCreateGoals && (
          <Button onClick={() => setShowGoalForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        )}
      </div>

      {/* Goals Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedGoals.length}</div>
          </CardContent>
        </Card>
        
        {canManageAllGoals && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deleted</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deletedGoals.length}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Goals Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Goals</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          {canManageAllGoals && (
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeGoals.length > 0 ? (
            renderGoalsList(activeGoals)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active goals</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by creating your first goal to track your progress
                </p>
                {canCreateGoals && (
                  <Button onClick={() => setShowGoalForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {completedGoals.length > 0 ? (
            renderGoalsList(completedGoals)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed goals</h3>
                <p className="text-muted-foreground">Complete your active goals to see them here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-6">
          {archivedGoals.length > 0 ? (
            renderGoalsList(archivedGoals)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No archived goals</h3>
                <p className="text-muted-foreground">Archive goals you want to keep but aren't actively working on</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManageAllGoals && (
          <TabsContent value="deleted" className="space-y-6">
            {deletedGoals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {deletedGoals.map((goal) => (
                  <Card key={goal.id} className="border-red-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge variant="destructive">Deleted</Badge>
                      </div>
                      {goal.description && (
                        <CardDescription>{goal.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRestoreGoal(goal.id)}
                        >
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onPermanentlyDeleteGoal(goal.id)}
                        >
                          Delete Permanently
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No deleted goals</h3>
                  <p className="text-muted-foreground">Deleted goals will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Goal Form Dialog */}
      {(showGoalForm || editingGoal) && (
        <GoalForm
          goal={editingGoal}
          availableUsers={availableUsers}
          currentUserId={currentUserId}
          userRole={userRole}
          onSubmit={editingGoal ? handleEditGoal : handleAddGoal}
          onCancel={() => {
            setShowGoalForm(false);
            setEditingGoal(null);
          }}
        />
      )}

      {/* Link Goals Dialog */}
      {linkingGoalId && (
        <LinkGoalsDialog
          goalId={linkingGoalId}
          availableGoals={filteredGoals.filter(g => g.id !== linkingGoalId)}
          currentUserId={currentUserId}
          onClose={() => setLinkingGoalId(null)}
          onLinkageChange={() => {
            // Refresh data or handle linkage change
            console.log('Goal linkage changed');
          }}
        />
      )}
    </div>
  );
};
