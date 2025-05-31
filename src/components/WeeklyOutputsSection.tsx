
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Trash2, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { EditWeeklyOutputDialog } from './EditWeeklyOutputDialog';
import { MoveWeeklyOutputDialog } from './MoveWeeklyOutputDialog';
import { WeeklyOutput } from '@/types/productivity';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, addWeeks, isWithinInterval, isSameWeek } from 'date-fns';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';

interface WeeklyOutputsSectionProps {
  weeklyOutputs: WeeklyOutput[];
  deletedWeeklyOutputs: WeeklyOutput[];
  overdueWeeklyOutputs: WeeklyOutput[];
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => void;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onMoveWeeklyOutput: (id: string, newDueDate: Date) => void;
  onDeleteWeeklyOutput: (id: string) => void;
  onRestoreWeeklyOutput: (id: string) => void;
  onPermanentlyDeleteWeeklyOutput: (id: string) => void;
}

export const WeeklyOutputsSection = ({
  weeklyOutputs,
  deletedWeeklyOutputs,
  overdueWeeklyOutputs,
  onAddWeeklyOutput,
  onEditWeeklyOutput,
  onUpdateProgress,
  onMoveWeeklyOutput,
  onDeleteWeeklyOutput,
  onRestoreWeeklyOutput,
  onPermanentlyDeleteWeeklyOutput,
}: WeeklyOutputsSectionProps) => {
  const [editingOutput, setEditingOutput] = useState<WeeklyOutput | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const today = new Date();
  const isCurrentWeek = isSameWeek(selectedWeek, today, { weekStartsOn: 1 });

  // Filter outputs for the selected week
  const weekOutputs = weeklyOutputs.filter(output => {
    if (!output.dueDate) return true; // Show outputs without due dates in all weeks
    return isWithinInterval(output.dueDate, { start: weekStart, end: weekEnd });
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const isOverdue = (output: WeeklyOutput) => {
    return output.dueDate && isWeeklyOutputOverdue(output.dueDate, output.progress);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Outputs
            {overdueWeeklyOutputs.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {overdueWeeklyOutputs.length} overdue
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isCurrentWeek ? 'This Week' : format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <DeletedWeeklyOutputsDialog
            deletedWeeklyOutputs={deletedWeeklyOutputs}
            onRestore={onRestoreWeeklyOutput}
            onPermanentlyDelete={onPermanentlyDeleteWeeklyOutput}
          />
          <AddWeeklyOutputDialog onAddWeeklyOutput={onAddWeeklyOutput} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev Week
          </Button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
            </span>
            {!isCurrentWeek && (
              <Button
                size="sm"
                variant="ghost"
                onClick={goToCurrentWeek}
                className="text-xs"
              >
                Current Week
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-1"
          >
            Next Week
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {weekOutputs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No weekly outputs for this week</p>
          ) : (
            weekOutputs.map((output) => (
              <div key={output.id} className={`p-4 rounded-lg border ${
                isOverdue(output) ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
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
                        <span className={isOverdue(output) ? 'text-red-600 font-medium' : ''}>
                          Due: {isToday(output.dueDate) ? 'Today' : isTomorrow(output.dueDate) ? 'Tomorrow' : format(output.dueDate, 'MMM dd')}
                          {isOverdue(output) && ' (Overdue)'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={output.progress === 100 ? 'default' : isOverdue(output) ? 'destructive' : 'secondary'} 
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
                    className={`h-2 ${isOverdue(output) ? 'bg-red-100' : ''}`}
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
            ))
          )}
        </div>
      </CardContent>
      
      {editingOutput && (
        <EditWeeklyOutputDialog
          weeklyOutput={editingOutput}
          open={true}
          onOpenChange={(open) => !open && setEditingOutput(null)}
          onSave={onEditWeeklyOutput}
        />
      )}
    </Card>
  );
};
