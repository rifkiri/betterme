
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { CompletedWeeklyOutputsDialog } from './CompletedWeeklyOutputsDialog';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { WeeklyOutputCard } from './WeeklyOutputCard';
import { WeekNavigator } from './WeekNavigator';
import { WeeklyOutput, Task, Goal } from '@/types/productivity';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, isSameWeek, isBefore } from 'date-fns';

interface WeeklyOutputsSectionProps {
  weeklyOutputs: WeeklyOutput[];
  deletedWeeklyOutputs: WeeklyOutput[];
  overdueWeeklyOutputs: WeeklyOutput[];
  tasks: Task[];
  goals?: Goal[];
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => Promise<void>;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => Promise<void>;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onMoveWeeklyOutput: (id: string, newDueDate: Date) => void;
  onDeleteWeeklyOutput: (id: string) => void;
  onRestoreWeeklyOutput: (id: string) => void;
  onPermanentlyDeleteWeeklyOutput: (id: string) => void;
  onRefresh?: () => Promise<void>;
}

export const WeeklyOutputsSection = ({
  weeklyOutputs,
  deletedWeeklyOutputs,
  overdueWeeklyOutputs,
  tasks,
  goals = [],
  onAddWeeklyOutput,
  onEditWeeklyOutput,
  onUpdateProgress,
  onMoveWeeklyOutput,
  onDeleteWeeklyOutput,
  onRestoreWeeklyOutput,
  onPermanentlyDeleteWeeklyOutput,
  onRefresh
}: WeeklyOutputsSectionProps) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  const weekStart = startOfWeek(selectedWeek, {
    weekStartsOn: 0
  });
  const weekEnd = endOfWeek(selectedWeek, {
    weekStartsOn: 0
  });
  const today = new Date();
  const isCurrentWeek = isSameWeek(selectedWeek, today, {
    weekStartsOn: 0
  });

  // Enhanced filtering for outputs in the selected week
  const getOutputsForSelectedWeek = () => {
    return weeklyOutputs.filter(output => {
      // Show outputs due in this week (regardless of completion status)
      if (output.dueDate && isWithinInterval(output.dueDate, { start: weekStart, end: weekEnd })) {
        return true;
      }
      
      // Show completed outputs that were completed in this week (even if they were overdue)
      if (output.progress >= 100 && output.completedDate && isWithinInterval(output.completedDate, { start: weekStart, end: weekEnd })) {
        return true;
      }
      
      // Show outputs without due dates in all weeks
      if (!output.dueDate) {
        return true;
      }
      
      return false;
    });
  };

  const weekOutputs = getOutputsForSelectedWeek();

  // For current week, show incomplete outputs from previous weeks that are truly overdue
  const rolledOverOutputs = isCurrentWeek ? weeklyOutputs.filter(output => {
    // Must have a due date and progress must be less than 100%
    if (!output.dueDate || output.progress >= 100) return false;
    
    // Must be due before today (overdue)
    if (!isBefore(output.dueDate, today)) return false;
    
    // Must NOT be from the current week
    return !isWithinInterval(output.dueDate, {
      start: weekStart,
      end: weekEnd
    });
  }) : [];

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-4 pb-2 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">
            <span className="truncate">Weekly Outputs</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isCurrentWeek ? 'This Week' : format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </CardDescription>
        </div>
        <div className="space-y-2">
          {/* First row: Deleted and Add Outputs */}
          <div className="flex items-center gap-2">
            <DeletedWeeklyOutputsDialog 
              deletedWeeklyOutputs={deletedWeeklyOutputs} 
              onRestore={onRestoreWeeklyOutput} 
              onPermanentlyDelete={onPermanentlyDeleteWeeklyOutput} 
            />
            <AddWeeklyOutputDialog 
              onAddWeeklyOutput={onAddWeeklyOutput}
              availableGoals={goals}
            />
          </div>
          
          {/* Second row: Completed */}
          <div className="flex items-center">
            <CompletedWeeklyOutputsDialog 
              weeklyOutputs={weeklyOutputs} 
              onUpdateProgress={onUpdateProgress} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <WeekNavigator 
          selectedWeek={selectedWeek} 
          onNavigateWeek={navigateWeek} 
          onGoToCurrentWeek={goToCurrentWeek} 
        />

        <div className="space-y-3 sm:space-y-6">
          {/* Current week outputs */}
          <div>
            {weekOutputs.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No weekly outputs for this week</p>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {weekOutputs.map(output => (
                  <WeeklyOutputCard 
                    key={output.id} 
                    output={output}
                    tasks={tasks}
                    goals={goals}
                    onEditWeeklyOutput={onEditWeeklyOutput} 
                    onUpdateProgress={onUpdateProgress} 
                    onMoveWeeklyOutput={onMoveWeeklyOutput} 
                    onDeleteWeeklyOutput={onDeleteWeeklyOutput}
                    onRefresh={onRefresh}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Rolled over outputs section (only show in current week and only incomplete ones) */}
          {isCurrentWeek && rolledOverOutputs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-600 mb-2 sm:mb-3 flex items-center gap-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Rolled Over from Previous Weeks</span>
              </h3>
              <div className="space-y-2 sm:space-y-4">
                {rolledOverOutputs.map(output => (
                  <WeeklyOutputCard 
                    key={output.id} 
                    output={output} 
                    tasks={tasks}
                    goals={goals}
                    onEditWeeklyOutput={onEditWeeklyOutput} 
                    onUpdateProgress={onUpdateProgress} 
                    onMoveWeeklyOutput={onMoveWeeklyOutput} 
                    onDeleteWeeklyOutput={onDeleteWeeklyOutput} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
