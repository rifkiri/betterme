import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Trash2, Link, Eye } from 'lucide-react';
import { Goal, Task, WeeklyOutput } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';
import { EditGoalDialog } from './EditGoalDialog';
import { MoveGoalDialog } from './MoveGoalDialog';
import { GoalDetailsDialog } from './GoalDetailsDialog';

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
  isCompleted = false
}: GoalCardProps) => {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const linkedOutputsCount = goal.linkedOutputIds?.length || 0;
  const linkedOutputs = weeklyOutputs.filter(output => goal.linkedOutputIds?.includes(output.id));

  return (
    <>
      <div className={`p-4 rounded-lg border ${
        isOverdue ? 'bg-red-50 border-red-200' : 
        isCompleted ? 'bg-green-50 border-green-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 transition-colors" onClick={() => setShowDetailsDialog(true)}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{goal.title}</p>
                <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                  {goal.category}
                </Badge>
              </div>
              {goal.description && (
                <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {linkedOutputsCount > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-50 text-green-600 border-green-200">
                  <Link className="h-2 w-2" />
                  {linkedOutputsCount} output{linkedOutputsCount !== 1 ? 's' : ''} linked
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {goal.currentValue}/{goal.targetValue} {goal.unit}
              </span>
            </div>
            {goal.deadline && (
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  Due: {isToday(goal.deadline) ? 'Today' : isTomorrow(goal.deadline) ? 'Tomorrow' : format(goal.deadline, 'MMM dd')}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={goal.progress === 100 ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-xs">
              {goal.progress}%
            </Badge>
            <Button size="sm" variant="outline" onClick={() => setShowDetailsDialog(true)} className="text-xs px-2 py-1" title="View Details">
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingGoal(goal)} className="text-xs px-2 py-1">
              Edit
            </Button>
            <MoveGoalDialog onMoveGoal={newDeadline => onMoveGoal(goal.id, newDeadline)} disabled={goal.progress === 100} />
            <Button size="sm" variant="outline" onClick={() => onDeleteGoal(goal.id)} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="mb-3">
          <Progress value={goal.progress} className={`h-2 ${isOverdue ? 'bg-red-100' : ''}`} />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onUpdateProgress(goal.id, Math.max(0, goal.progress - 10))} 
            disabled={goal.progress <= 0} 
            className="text-xs px-2 py-1"
          >
            -10%
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onUpdateProgress(goal.id, Math.min(100, goal.progress + 10))} 
            disabled={goal.progress >= 100} 
            className="text-xs px-2 py-1"
          >
            +10%
          </Button>
          {goal.progress !== 100 && (
            <Button size="sm" variant="default" onClick={() => onUpdateProgress(goal.id, 100)} className="text-xs px-2 py-1">
              Achieved
            </Button>
          )}
        </div>
      </div>
      
      <GoalDetailsDialog
        goal={goal}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onEditGoal={onEditGoal}
        onUpdateProgress={onUpdateProgress}
        weeklyOutputs={weeklyOutputs}
        tasks={tasks}
      />
      
      {editingGoal && (
        <EditGoalDialog 
          goal={editingGoal} 
          open={true} 
          onOpenChange={open => !open && setEditingGoal(null)} 
          onSave={onEditGoal}
          weeklyOutputs={weeklyOutputs}
        />
      )}
    </>
  );
};