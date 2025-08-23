
import { useState } from 'react';
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
import { ContentCard, StatusBadge, LinkBadge, ProgressControls, ActionButtonGroup, DateDisplay } from '@/components/ui/standardized';
import { getContentCardVariant, getStatusBadgeStatus, formatCountDisplay } from '@/utils/standardizedHelpers';

interface WeeklyOutputCardProps {
  output: WeeklyOutput;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => Promise<void>;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onMoveWeeklyOutput: (id: string, newDueDate: Date) => void;
  onDeleteWeeklyOutput: (id: string) => void;
  tasks?: Task[];
  goals?: Goal[];
  onRefresh?: () => Promise<void>;
}

export const WeeklyOutputCard = ({
  output,
  onEditWeeklyOutput,
  onUpdateProgress,
  onMoveWeeklyOutput,
  onDeleteWeeklyOutput,
  tasks = [],
  goals = [],
  onRefresh
}: WeeklyOutputCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  // Find the linked goal using the simple linkedGoalId field
  const linkedGoal = output.linkedGoalId ? goals.find(g => g.id === output.linkedGoalId) : null;
  
  const isOverdue = () => {
    return output.dueDate && isWeeklyOutputOverdue(output.dueDate, output.progress, output.completedDate, output.createdDate);
  };

  const linkedTasksCount = tasks.filter(task => task.weeklyOutputId === output.id).length;

  return (
    <>
      <ContentCard variant={getContentCardVariant(isOverdue(), output.progress === 100)}>
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
                <LinkBadge variant="success">
                  {formatCountDisplay(linkedTasksCount, "task")} linked
                </LinkBadge>
              )}
              {linkedGoal && (
                <LinkBadge variant="info">
                  {linkedGoal.title}
                </LinkBadge>
              )}
            </div>
            {output.dueDate && (
              <DateDisplay 
                date={output.dueDate}
                isOverdue={isOverdue()}
                prefix="Due:"
              />
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            <StatusBadge 
              status={getStatusBadgeStatus(output.progress, isOverdue(), output.progress === 100)}
            >
              {output.progress}%
            </StatusBadge>
            <ActionButtonGroup
              layout="vertical"
              onView={() => setShowDetailsDialog(true)}
              onDelete={() => onDeleteWeeklyOutput(output.id)}
              customActions={
                <MoveWeeklyOutputDialog 
                  onMoveOutput={newDueDate => onMoveWeeklyOutput(output.id, newDueDate)} 
                  disabled={output.progress === 100} 
                />
              }
            />
          </div>
        </div>
        
        <div className="mb-3">
          <Progress value={output.progress} className={`h-2 ${isOverdue() ? 'bg-red-100' : ''}`} />
        </div>
        
        <ProgressControls
          progress={output.progress}
          onDecrease={() => onUpdateProgress(output.id, output.progress - 10)}
          onIncrease={() => onUpdateProgress(output.id, output.progress + 10)}
          onComplete={() => onUpdateProgress(output.id, 100)}
          step={10}
        />
      </ContentCard>
      
      <OutputDetailsDialog
        output={output}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onEditWeeklyOutput={onEditWeeklyOutput}
        onUpdateProgress={onUpdateProgress}
        onRefresh={onRefresh}
        goals={goals}
        tasks={tasks}
      />
    </>
  );
};
