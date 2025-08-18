
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Trash2, Link, Eye, Minus, Plus, CheckCircle } from 'lucide-react';
import { WeeklyOutput, Task, Goal } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';
import { EditWeeklyOutputDialog } from './EditWeeklyOutputDialog';
import { MoveWeeklyOutputDialog } from './MoveWeeklyOutputDialog';
import { OutputDetailsDialog } from './OutputDetailsDialog';
import { itemLinkageService } from '@/services/ItemLinkageService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface WeeklyOutputCardProps {
  output: WeeklyOutput;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onMoveWeeklyOutput: (id: string, newDueDate: Date) => void;
  onDeleteWeeklyOutput: (id: string) => void;
  tasks?: Task[];
  goals?: Goal[];
}

export const WeeklyOutputCard = ({
  output,
  onEditWeeklyOutput,
  onUpdateProgress,
  onMoveWeeklyOutput,
  onDeleteWeeklyOutput,
  tasks = [],
  goals = []
}: WeeklyOutputCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [linkedGoalsCount, setLinkedGoalsCount] = useState(0);
  const { currentUser } = useCurrentUser();
  
  // Refresh linked goals count
  const fetchLinkedGoals = async () => {
    if (currentUser?.id) {
      try {
        const linkedItems = await itemLinkageService.getLinkedItems('weekly_output', output.id, currentUser.id);
        const goalCount = linkedItems.filter(item => item.type === 'goal').length;
        setLinkedGoalsCount(goalCount);
      } catch (error) {
        console.error('Error fetching linked goals:', error);
      }
    }
  };

  useEffect(() => {
    fetchLinkedGoals();
  }, [output.id, currentUser?.id]);

  // Add key prop listener for when output is updated to refresh count
  useEffect(() => {
    fetchLinkedGoals();
  }, [output.title, output.description, output.progress]);
  
  const isOverdue = () => {
    return output.dueDate && isWeeklyOutputOverdue(output.dueDate, output.progress, output.completedDate, output.createdDate);
  };

  const linkedTasksCount = tasks.filter(task => task.weeklyOutputId === output.id).length;

  return (
    <>
      <div className={`p-4 rounded-lg border ${isOverdue() ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 transition-colors" onClick={() => setShowDetailsDialog(true)}>
              <p className={`text-sm leading-relaxed mb-2 ${output.progress >= 100 ? 'line-through text-gray-500' : 'text-gray-700'}`}>{output.title}</p>
              {output.description && (
                <p className="text-xs text-gray-600 mb-2">{output.description}</p>
              )}
              {output.isMoved && output.originalDueDate && (
                <p className="text-xs text-orange-600 mb-1">
                  Moved from: {format(output.originalDueDate, 'MMM dd')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {linkedTasksCount > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-50 text-green-600 border-green-200">
                  <Link className="h-2 w-2" />
                  {linkedTasksCount} task{linkedTasksCount !== 1 ? 's' : ''} linked
                </Badge>
              )}
              {linkedGoalsCount > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200">
                  <Link className="h-2 w-2" />
                  {linkedGoalsCount} goal{linkedGoalsCount !== 1 ? 's' : ''} linked
                </Badge>
              )}
            </div>
            {output.dueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span className={isOverdue() ? 'text-red-600 font-medium' : ''}>
                  Due: {isToday(output.dueDate) ? 'Today' : isTomorrow(output.dueDate) ? 'Tomorrow' : format(output.dueDate, 'MMM dd')}
                  {isOverdue() && ' (Overdue)'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={output.progress === 100 ? 'default' : isOverdue() ? 'destructive' : 'secondary'} className="text-xs">
              {output.progress}%
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowDetailsDialog(true)} 
              className="h-8 w-8 p-0" 
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <MoveWeeklyOutputDialog onMoveOutput={newDueDate => onMoveWeeklyOutput(output.id, newDueDate)} disabled={output.progress === 100} />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDeleteWeeklyOutput(output.id)} 
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" 
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mb-3">
          <Progress value={output.progress} className={`h-2 ${isOverdue() ? 'bg-red-100' : ''}`} />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onUpdateProgress(output.id, output.progress - 10)} 
            disabled={output.progress <= 0} 
            className="h-8 w-8 p-0"
            title="Decrease Progress"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onUpdateProgress(output.id, output.progress + 10)} 
            disabled={output.progress >= 100} 
            className="h-8 w-8 p-0"
            title="Increase Progress"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {output.progress !== 100 && (
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => onUpdateProgress(output.id, 100)} 
              className="h-8 w-8 p-0"
              title="Mark as Achieved"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <OutputDetailsDialog
        output={output}
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          // Refresh linked goals count when details dialog closes
          if (!open) {
            setTimeout(fetchLinkedGoals, 100);
          }
        }}
        onEditWeeklyOutput={onEditWeeklyOutput}
        onUpdateProgress={onUpdateProgress}
        goals={goals}
        tasks={tasks}
      />
    </>
  );
};
