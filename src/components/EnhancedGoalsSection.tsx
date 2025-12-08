import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { SimpleAddGoalDialog } from './SimpleAddGoalDialog';
import { JoinGoalDialog } from './JoinGoalDialog';
import { DeletedGoalsDialog } from './DeletedGoalsDialog';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import { MarketplaceGoalCard } from './MarketplaceGoalCard';
import { MarketplaceFilters } from '@/components/ui/MarketplaceFilters';
import { Goal, WeeklyOutput, Habit, GoalAssignment, Task } from '@/types/productivity';
import { Target, Briefcase, User, Plus, CheckCircle, Minus, Edit, Trash2, Eye, Link2, Store, RotateCcw } from 'lucide-react';
import { mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { PageContainer, PageHeader } from '@/components/ui/standardized';
import { Label } from '@/components/ui/label';

interface EnhancedGoalsSectionProps {
  goals: Goal[];
  allGoals: Goal[];
  deletedGoals: Goal[];
  marketplaceDeletedGoals: Goal[];
  habits: Habit[];
  tasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  userRole?: string;
  assignments: GoalAssignment[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'createdDate'>) => void;
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onRestoreGoal: (id: string) => void;
  onPermanentlyDeleteGoal: (id: string) => void;
  onUpdateGoalProgress: (goalId: string, progress: number) => void;
  onJoinWorkGoal: (goalId: string, role?: 'coach' | 'lead' | 'member') => void;
  onLeaveWorkGoal: (goalId: string) => void;
  onRestoreDeletedGoal?: (goalId: string) => Promise<void>;
  onRefresh?: (date?: Date) => Promise<void>;
}

export const EnhancedGoalsSection = ({
  goals,
  allGoals,
  deletedGoals,
  marketplaceDeletedGoals,
  habits,
  tasks,
  weeklyOutputs,
  availableUsers = [],
  currentUserId,
  userRole,
  assignments,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onRestoreGoal,
  onPermanentlyDeleteGoal,
  onUpdateGoalProgress,
  onJoinWorkGoal,
  onLeaveWorkGoal,
  onRestoreDeletedGoal,
  onRefresh
}: EnhancedGoalsSectionProps) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'marketplace'>('active');
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [isLoadingGoalDetails, setIsLoadingGoalDetails] = useState(false);
  
  // Marketplace filters state
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [marketplaceSubcategory, setMarketplaceSubcategory] = useState('all');
  const [marketplaceRole, setMarketplaceRole] = useState('all');
  const [marketplaceSortBy, setMarketplaceSortBy] = useState('newest');
  const [showDeletedGoals, setShowDeletedGoals] = useState(false);
  
  const isAdmin = userRole === 'admin';

  // Handle opening goal details with better error handling
  const handleViewGoalDetails = (goal: Goal) => {
    console.log('[EnhancedGoalsSection] Opening goal details:', {
      goalId: goal.id,
      title: goal.title,
      category: goal.category,
      visibility: goal.visibility,
      currentUserId,
      userRole
    });
    
    // Ensure we have a valid goal object before opening dialog
    if (!goal || !goal.id) {
      console.error('[EnhancedGoalsSection] Invalid goal object:', goal);
      return;
    }
    
    setViewingGoal(goal);
  };

  // Update viewingGoal when goals array changes to keep it in sync
  useEffect(() => {
    if (viewingGoal) {
      // Try to find the goal in either the user's goals or all goals
      const updatedGoal = goals.find(goal => goal.id === viewingGoal.id) || 
                          allGoals.find(goal => goal.id === viewingGoal.id);
      
      if (updatedGoal && JSON.stringify(updatedGoal) !== JSON.stringify(viewingGoal)) {
        console.log('[EnhancedGoalsSection] Updating viewing goal with new data');
        setViewingGoal(updatedGoal);
      } else if (!updatedGoal) {
        // Goal was deleted or moved, close the dialog
        console.log('[EnhancedGoalsSection] Goal no longer available, closing dialog');
        setViewingGoal(null);
      }
    }
  }, [goals, allGoals, viewingGoal]);

  // Helper function to check if user is assigned to a goal
  const isUserAssignedToGoal = (goalId: string) => {
    return assignments.some(a => a.goalId === goalId && a.userId === currentUserId);
  };

  // Filter goals by completion status - only show goals where user has an assignment
  const activeGoals = useMemo(() => {
    return goals.filter(goal => 
      goal.progress < 100 && 
      !goal.archived && 
      isUserAssignedToGoal(goal.id)
    );
  }, [goals, assignments, currentUserId]);

  const completedGoals = useMemo(() => {
    // Use allGoals to show all completed goals the user can access
    // RLS policies already filter what goals the user can see
    return allGoals.filter(goal => 
      goal.progress >= 100 && !goal.archived
    );
  }, [allGoals]);

  const isManager = userRole === 'manager' || userRole === 'admin';

  // Filter marketplace goals - show ALL active work goals (regardless of user assignment)
  const marketplaceGoals = useMemo(() => {
    let filtered = allGoals.filter(goal => 
      goal.category === 'work' && 
      !goal.archived && 
      goal.progress < 100
    );

    // Apply search filter
    if (marketplaceSearch) {
      const searchLower = marketplaceSearch.toLowerCase();
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchLower) ||
        (goal.description && goal.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply subcategory filter
    if (marketplaceSubcategory !== 'all') {
      filtered = filtered.filter(goal => goal.subcategory === marketplaceSubcategory);
    }

    // Apply role availability filter
    if (marketplaceRole !== 'all') {
      filtered = filtered.filter(goal => {
        const goalAssignments = assignments.filter(a => a.goalId === goal.id);
        const coach = goalAssignments.find(a => a.role === 'coach');
        const lead = goalAssignments.find(a => a.role === 'lead');
        
        switch(marketplaceRole) {
          case 'coach':
            return !coach;
          case 'lead':
            return !lead;
          case 'member':
            return true; // Members can always join
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch(marketplaceSortBy) {
        case 'newest':
          return b.createdDate.getTime() - a.createdDate.getTime();
        case 'oldest':
          return a.createdDate.getTime() - b.createdDate.getTime();
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        case 'progress-asc':
          return a.progress - b.progress;
        case 'progress-desc':
          return b.progress - a.progress;
        case 'team-size':
          const aSize = assignments.filter(as => as.goalId === a.id).length;
          const bSize = assignments.filter(as => as.goalId === b.id).length;
          return bSize - aSize;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allGoals, currentUserId, marketplaceSearch, marketplaceSubcategory, marketplaceRole, marketplaceSortBy, assignments]);

  const clearMarketplaceFilters = () => {
    setMarketplaceSearch('');
    setMarketplaceSubcategory('all');
    setMarketplaceRole('all');
    setMarketplaceSortBy('newest');
  };

  const hasActiveMarketplaceFilters = marketplaceSearch !== '' || 
                                      marketplaceSubcategory !== 'all' || 
                                      marketplaceRole !== 'all' ||
                                      marketplaceSortBy !== 'newest';

  const getCategoryIcon = (category: 'work' | 'personal') => {
    return category === 'work' ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getCategoryColor = (category: 'work' | 'personal') => {
    return category === 'work' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getUserRole = (goal: Goal) => {
    if (!currentUserId) return null;
    
    // Use assignments data instead of legacy arrays
    const assignment = assignments.find(a => a.goalId === goal.id && a.userId === currentUserId);
    if (assignment) {
      return assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1); // Capitalize first letter
    }
    return null;
  };

  const renderGoalCard = (goal: Goal) => {
    const goalUserRole = getUserRole(goal);
    const progressColor = goal.progress >= 80 ? 'bg-green-500' : 
                         goal.progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500';
    
    // Find linked items
    const linkedOutputs = weeklyOutputs.filter(output => output.linkedGoalId === goal.id);
    const linkedHabits = goal.category === 'personal' ? habits.filter(habit => habit.linkedGoalId === goal.id) : [];
    
    // Determine if user owns the goal or is just assigned to it
    const isGoalOwner = goal.userId === currentUserId || goal.createdBy === currentUserId;
    const isAssignedUser = goalUserRole !== null; // User has any role assigned
    const canManageGoal = isGoalOwner || isManager;
    
    // For work goals, show both Delete (if owner/manager) and Leave (if assigned but not owner)
    const userAssignment = assignments.find(a => a.goalId === goal.id && a.userId === currentUserId);
    const showLeaveOption = goal.category === 'work' && userAssignment && goalUserRole && !isGoalOwner;
    const showDeleteOption = canManageGoal;

    return (
      <Card key={goal.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="mb-2">
              <div className="flex items-center gap-2">
                {getCategoryIcon(goal.category)}
                <CardTitle className="text-lg">{goal.title}</CardTitle>
              </div>
              {goalUserRole && (
                <div className="text-xs text-gray-500 mt-1">{goalUserRole}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getCategoryColor(goal.category)}>
                {goal.category === 'work' ? 'Work' : 'Personal'}
              </Badge>
              {goal.subcategory && (
                <Badge variant="outline" className="text-xs bg-white border-gray-300">
                  {mapSubcategoryDatabaseToDisplay(goal.subcategory)}
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

          {/* Linked Items */}
          {(linkedOutputs.length > 0 || linkedHabits.length > 0) && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-1 mb-2">
                <Link2 className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Linked Items</span>
              </div>
              <div className="space-y-1">
                {linkedOutputs.length > 0 && (
                  <div className="text-xs">
                    <span className="text-gray-500">Outputs ({linkedOutputs.length}):</span>
                    <div className="text-gray-700 mt-1 line-clamp-2">
                      {linkedOutputs.slice(0, 2).map((output, idx) => (
                        <span key={output.id}>
                          {output.title}
                          {idx < Math.min(linkedOutputs.length - 1, 1) && ', '}
                        </span>
                      ))}
                      {linkedOutputs.length > 2 && (
                        <span className="text-gray-400"> +{linkedOutputs.length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}
                {linkedHabits.length > 0 && (
                  <div className="text-xs">
                    <span className="text-gray-500">Habits ({linkedHabits.length}):</span>
                    <div className="text-gray-700 mt-1 line-clamp-2">
                      {linkedHabits.slice(0, 2).map((habit, idx) => (
                        <span key={habit.id}>
                          {habit.name}
                          {idx < Math.min(linkedHabits.length - 1, 1) && ', '}
                        </span>
                      ))}
                      {linkedHabits.length > 2 && (
                        <span className="text-gray-400"> +{linkedHabits.length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Work Goal Team Info */}
          {goal.category === 'work' && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Team Assignment</p>
              <div className="flex flex-wrap gap-1 text-xs">
                {(() => {
                  const goalAssignments = assignments.filter(a => a.goalId === goal.id);
                  const totalMembers = goalAssignments.length;
                  return `${totalMembers} team member${totalMembers !== 1 ? 's' : ''}`;
                })()}
              </div>
              
              <div className="mt-2 space-y-1">
                {/* Coach */}
                {(() => {
                  const coach = assignments.find(a => a.goalId === goal.id && a.role === 'coach');
                  return coach ? (
                    <div className="text-xs text-muted-foreground">
                      Coach: {availableUsers.find(u => u.id === coach.userId)?.name || 'Unknown'}
                    </div>
                  ) : null;
                })()}
                
                {/* Lead */}
                {(() => {
                  const lead = assignments.find(a => a.goalId === goal.id && a.role === 'lead');
                  return lead ? (
                    <div className="text-xs text-muted-foreground">
                      Lead: {availableUsers.find(u => u.id === lead.userId)?.name || 'Unknown'}
                    </div>
                  ) : null;
                })()}
                
                {/* Members */}
                {(() => {
                  const members = assignments.filter(a => a.goalId === goal.id && a.role === 'member');
                  return members.length > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      Members: {members.map(m => availableUsers.find(u => u.id === m.userId)?.name || 'Unknown').join(', ')}
                    </div>
                  ) : null;
                })()}
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
              onClick={() => handleViewGoalDetails(goal)}
              title="View Details"
              disabled={isLoadingGoalDetails}
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
            
            {/* Progress Controls - for all assigned users, owners, and admins */}
            {(goalUserRole || isGoalOwner || userRole === 'admin') && (
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
    <PageContainer gradient="blue-green">
      <PageHeader 
        title="My Goals" 
        subtitle="Track your personal and work goals, collaborate with your team" 
      />

      {/* Tabs positioned below header subtitle like TeamDashboard */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'completed' | 'marketplace')}>
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
          <TabsTrigger 
            value="marketplace" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Store className="h-3 w-3 sm:h-4 sm:w-4" />
            Goal Marketplace ({marketplaceGoals.length})
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
                <DeletedGoalsDialog
                  deletedGoals={deletedGoals}
                  onRestore={onRestoreGoal}
                  onPermanentlyDelete={onPermanentlyDeleteGoal}
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

        <TabsContent value="marketplace" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Goal Marketplace</h3>
                <p className="text-sm text-muted-foreground">Discover and join work goals from across the organization</p>
              </div>
              
              {/* Admin Toggle for Deleted Goals */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
                  <Switch
                    id="show-deleted"
                    checked={showDeletedGoals}
                    onCheckedChange={setShowDeletedGoals}
                  />
                  <Label htmlFor="show-deleted" className="text-sm font-medium cursor-pointer">
                    Show Deleted Goals ({marketplaceDeletedGoals.length})
                  </Label>
                </div>
              )}
            </div>

            {/* Marketplace Filters - Hidden when showing deleted goals */}
            {!showDeletedGoals && (
              <MarketplaceFilters
                searchTerm={marketplaceSearch}
                onSearchChange={setMarketplaceSearch}
                selectedSubcategory={marketplaceSubcategory}
                onSubcategoryChange={setMarketplaceSubcategory}
                selectedRole={marketplaceRole}
                onRoleChange={setMarketplaceRole}
                sortBy={marketplaceSortBy}
                onSortChange={setMarketplaceSortBy}
                onClearFilters={clearMarketplaceFilters}
                hasActiveFilters={hasActiveMarketplaceFilters}
              />
            )}
            
            {/* Results Count */}
            {!showDeletedGoals && marketplaceGoals.length > 0 && (
              <div className="text-sm text-muted-foreground mb-4">
                Found {marketplaceGoals.length} {marketplaceGoals.length === 1 ? 'goal' : 'goals'}
              </div>
            )}
            
            {/* Deleted Goals Info Banner */}
            {showDeletedGoals && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    Viewing {marketplaceDeletedGoals.length} deleted {marketplaceDeletedGoals.length === 1 ? 'goal' : 'goals'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  These goals have been soft-deleted and can be restored by clicking the restore button.
                </p>
              </div>
            )}
            
            {/* Marketplace Goals Grid - Active or Deleted based on toggle */}
            {!showDeletedGoals ? (
              marketplaceGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No goals available in the marketplace</p>
                  <p className="text-sm mt-1">Check back later for new opportunities to collaborate.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketplaceGoals.map(goal => {
                    const userAssignment = assignments.find(a => a.goalId === goal.id && a.userId === currentUserId);
                    return (
                      <MarketplaceGoalCard
                        key={goal.id}
                        goal={goal}
                        assignments={assignments}
                        availableUsers={availableUsers}
                        currentUserId={currentUserId}
                        isJoined={!!userAssignment}
                        onJoin={onJoinWorkGoal}
                        onViewDetails={handleViewGoalDetails}
                        userRole={userRole}
                        onDeleteGoal={onDeleteGoal}
                        onUpdateProgress={onUpdateGoalProgress}
                      />
                    );
                  })}
                </div>
              )
            ) : (
              marketplaceDeletedGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No deleted goals found</p>
                  <p className="text-sm mt-1">All work goals are currently active.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketplaceDeletedGoals.map(goal => (
                    <MarketplaceGoalCard
                      key={goal.id}
                      goal={goal}
                      assignments={assignments}
                      availableUsers={availableUsers}
                      currentUserId={currentUserId}
                      isJoined={false}
                      onJoin={onJoinWorkGoal}
                      onViewDetails={handleViewGoalDetails}
                      userRole={userRole}
                      onDeleteGoal={onDeleteGoal}
                      onUpdateProgress={onUpdateGoalProgress}
                      isDeleted={true}
                      onRestoreGoal={onRestoreDeletedGoal}
                    />
                  ))}
                </div>
              )
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Goal Details Dialog - Always render but control visibility with open prop */}
      <GoalDetailsDialog
        goal={viewingGoal || {} as Goal}
        open={!!viewingGoal}
        onOpenChange={(open) => {
          console.log('[EnhancedGoalsSection] Dialog open change:', open);
          if (!open) {
            setViewingGoal(null);
          }
        }}
        onEditGoal={onEditGoal}
        onUpdateProgress={onUpdateGoalProgress}
        weeklyOutputs={weeklyOutputs}
        tasks={tasks}
        habits={habits}
        currentUserId={currentUserId}
        onRefresh={onRefresh}
        assignments={assignments}
        availableUsers={availableUsers}
      />
    </PageContainer>
  );
};