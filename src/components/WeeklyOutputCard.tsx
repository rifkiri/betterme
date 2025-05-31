import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { WeeklyOutput } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';
import { EditWeeklyOutputDialog } from './EditWeeklyOutputDialog';
import { MoveWeeklyOutputDialog } from './MoveWeeklyOutputDialog';

interface WeeklyOutputCardProps {
  output: WeeklyOutput;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onMoveWeeklyOutput: (id: string, newDueDate: Date) => void;
  onDeleteWeeklyOutput: (id: string) => void;
}

export const WeeklyOutputCard = ({
  output,
  onEditWeeklyOutput,
  onUpdateProgress,
  onMoveWeeklyOutput,
  onDeleteWeeklyOutput,
}: WeeklyOutputCardProps) => {
  const [editingOutput, setEditingOutput] = useState<WeeklyOutput | null>(null);

  const isOverdue = () => {
    return output.dueDate && isWeeklyOutputOverdue(output.dueDate);
  };

  return (
    <>
      <div className={`p-4 rounded-lg border ${
        isOverdue() ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div 
              className="cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 transition-colors"
              onClick={() => setEditingOutput(output)}
            >
              <p className="text-sm text-gray-700 leading-relaxed mb-2">{output.title}</p>
              {output.isMoved && output.originalDueDate && (
                <p className="text-xs text-orange-600 mb-1">
                  Moved from: {format(output.originalDueDate, 'MMM dd')}
                </p>
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
            <Badge 
              variant={output.progress === 100 ? 'default' : isOverdue() ? 'destructive' : 'secondary'} 
              className="text-xs"
            >
              {output.progress}%
            </Badge>
            <MoveWeeklyOutputDialog
              onMoveOutput={(newDueDate) => onMoveWeeklyOutput(output.id, newDueDate)}
              disabled={output.progress === 100}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteWeeklyOutput(output.id)}
              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="mb-3">
          <Progress 
            value={output.progress} 
            className={`h-2 ${isOverdue() ? 'bg-red-100' : ''}`}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateProgress(output.id, output.progress - 10)}
            disabled={output.progress <= 0}
            className="text-xs px-2 py-1"
          >
            -10%
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateProgress(output.id, output.progress + 10)}
            disabled={output.progress >= 100}
            className="text-xs px-2 py-1"
          >
            +10%
          </Button>
          {output.progress !== 100 && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onUpdateProgress(output.id, 100)}
              className="text-xs px-2 py-1"
            >
              Complete
            </Button>
          )}
        </div>
      </div>
      
      {editingOutput && (
        <EditWeeklyOutputDialog
          weeklyOutput={editingOutput}
          open={true}
          onOpenChange={(open) => !open && setEditingOutput(null)}
          onSave={onEditWeeklyOutput}
        />
      )}
    </>
  );
};
