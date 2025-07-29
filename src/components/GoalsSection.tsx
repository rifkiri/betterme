import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { DeletedGoalsDialog } from './DeletedGoalsDialog';
import { AddGoalDialog } from './AddGoalDialog';
import { GoalCard } from './GoalCard';
import { Goal, Task } from '@/types/productivity';
import { isBefore } from 'date-fns';

interface GoalsSectionProps {
  goals: Goal[];
  deletedGoals: Goal[];
  overdueGoals: Goal[];
  tasks: Task[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdDate' | 'progress'>) => void;
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onUpdateProgress: (goalId: string, newProgress: number) => void;
  onMoveGoal: (id: string, newDeadline: Date) => void;
  onDeleteGoal: (id: string) => void;
  onRestoreGoal: (id: string) => void;
  onPermanentlyDeleteGoal: (id: string) => void;
}

export const GoalsSection = ({
  goals,
  deletedGoals,
  overdueGoals,
  tasks,
  onAddGoal,
  onEditGoal,
  onUpdateProgress,
  onMoveGoal,
  onDeleteGoal,
  onRestoreGoal,
  onPermanentlyDeleteGoal
}: GoalsSectionProps) => {
  const today = new Date();

  // Filter active goals (not archived, not deleted)
  const activeGoals = goals.filter(goal => !goal.archived);
  
  // Filter completed goals
  const completedGoals = activeGoals.filter(goal => goal.completed);
  
  // Filter incomplete goals
  const incompleteGoals = activeGoals.filter(goal => !goal.completed);
  
  // Filter overdue incomplete goals
  const overdueIncompleteGoals = incompleteGoals.filter(goal => {
    if (!goal.deadline) return false;
    return isBefore(goal.deadline, today) && goal.progress < 100;
  });

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Goals</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Track your objectives and targets
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <DeletedGoalsDialog 
              deletedGoals={deletedGoals} 
              onRestore={onRestoreGoal} 
              onPermanentlyDelete={onPermanentlyDeleteGoal} 
            />
            <AddGoalDialog onAddGoal={onAddGoal} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-6">
          {/* Active incomplete goals */}
          <div>
            {incompleteGoals.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No active goals</p>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {incompleteGoals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    tasks={tasks}
                    onEditGoal={onEditGoal} 
                    onUpdateProgress={onUpdateProgress} 
                    onMoveGoal={onMoveGoal} 
                    onDeleteGoal={onDeleteGoal} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Overdue goals section */}
          {overdueIncompleteGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-2 sm:mb-3 flex items-center gap-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Overdue Goals</span>
              </h3>
              <div className="space-y-2 sm:space-y-4">
                {overdueIncompleteGoals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    tasks={tasks}
                    onEditGoal={onEditGoal} 
                    onUpdateProgress={onUpdateProgress} 
                    onMoveGoal={onMoveGoal} 
                    onDeleteGoal={onDeleteGoal} 
                    isOverdue={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed goals section */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 mb-2 sm:mb-3 flex items-center gap-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Completed Goals</span>
              </h3>
              <div className="space-y-2 sm:space-y-4">
                {completedGoals.slice(0, 3).map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    tasks={tasks}
                    onEditGoal={onEditGoal} 
                    onUpdateProgress={onUpdateProgress} 
                    onMoveGoal={onMoveGoal} 
                    onDeleteGoal={onDeleteGoal} 
                    isCompleted={true}
                  />
                ))}
                {completedGoals.length > 3 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    +{completedGoals.length - 3} more completed goals
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};