import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Trash2, Link, Eye, Minus, Plus, CheckCircle } from 'lucide-react';
import { Goal, Task, WeeklyOutput } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';
import { EditGoalDialog } from './EditGoalDialog';
import { PersonalGoalEditDialog } from './PersonalGoalEditDialog';
import { MoveGoalDialog } from './MoveGoalDialog';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import { mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { ContentCard } from '@/components/ui/content-card';
import { IconButton } from '@/components/ui/icon-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkBadge } from '@/components/ui/link-badge';
import { ProgressControls } from '@/components/ui/progress-controls';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { DateDisplay } from '@/components/ui/date-display';
import { getContentCardVariant, getStatusBadgeStatus, formatCountDisplay } from '@/utils/standardizedHelpers';

interface GoalCardProps {
  goal: Goal;
  tasks?: Task[];
  weeklyOutputs?: WeeklyOutput[];
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onUpdateProgress: (goalId: string, newProgress: number) => void;
  onMoveGoal: (id: string, newDeadline: Date) => void;
  onDeleteGoal: (id: string) => void;
  isOverdue?: boolean;
  isCompleted?: boolean;
  onRefresh?: () => Promise<void>;
  assignments?: any[];
  availableUsers?: any[];
}

export const GoalCard = ({
  goal,
  tasks = [],
  weeklyOutputs = [],
  onEditGoal,
  onUpdateProgress,
  onMoveGoal,
  onDeleteGoal,
  isOverdue = false,
  isCompleted = false,
  onRefresh,
  assignments = [],
  availableUsers = []
}: GoalCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate linked outputs using the restored linkedGoalId field  
  const linkedOutputs = weeklyOutputs?.filter(output => output.linkedGoalId === goal.id) || [];
  const linkedOutputsCount = linkedOutputs.length;

  return (
    <>
      <ContentCard variant={getContentCardVariant(isOverdue, isCompleted)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 transition-colors" onClick={() => setShowDetailsDialog(true)}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{goal.title}</p>
                <div className="flex items-center gap-1">
                  <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                    {goal.category}
                  </Badge>
                  {goal.subcategory && (
                    <Badge variant="outline" className="text-xs bg-white border-gray-300">
                      {mapSubcategoryDatabaseToDisplay(goal.subcategory)}
                    </Badge>
                  )}
                </div>
              </div>
              {goal.description && (
                <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {linkedOutputsCount > 0 && (
                <LinkBadge variant="success">
                  {formatCountDisplay(linkedOutputsCount, "output")} linked
                </LinkBadge>
              )}
              <span className="text-xs text-gray-500">
                Progress: {goal.progress}%
              </span>
            </div>
            {goal.deadline && (
              <DateDisplay 
                date={goal.deadline}
                isOverdue={isOverdue}
                prefix="Due:"
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge 
              status={getStatusBadgeStatus(goal.progress, isOverdue, isCompleted)}
            >
              {goal.progress}%
            </StatusBadge>
            <ActionButtonGroup
              onView={() => setShowDetailsDialog(true)}
              onDelete={() => onDeleteGoal(goal.id)}
              customActions={
                <MoveGoalDialog 
                  onMoveGoal={newDeadline => onMoveGoal(goal.id, newDeadline)} 
                  disabled={goal.progress === 100} 
                />
              }
            />
          </div>
        </div>
        
        <div className="mb-3">
          <Progress value={goal.progress} className={`h-2 ${isOverdue ? 'bg-red-100' : ''}`} />
        </div>
        
        <ProgressControls
          progress={goal.progress}
          onDecrease={() => onUpdateProgress(goal.id, Math.max(0, goal.progress - 10))}
          onIncrease={() => onUpdateProgress(goal.id, Math.min(100, goal.progress + 10))}
          onComplete={() => onUpdateProgress(goal.id, 100)}
          step={10}
        />
      </ContentCard>
      
      <GoalDetailsDialog
        goal={goal}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onEditGoal={onEditGoal}
        onUpdateProgress={onUpdateProgress}
        weeklyOutputs={weeklyOutputs}
        tasks={tasks}
        onRefresh={onRefresh}
        assignments={assignments}
        availableUsers={availableUsers}
      />
    </>
  );
};