
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { WeeklyOutputCard } from './WeeklyOutputCard';
import { WeekNavigator } from './WeekNavigator';
import { WeeklyOutput } from '@/types/productivity';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, isSameWeek } from 'date-fns';
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
  onPermanentlyDeleteWeeklyOutput
}: WeeklyOutputsSectionProps) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const weekStart = startOfWeek(selectedWeek, {
    weekStartsOn: 1
  });
  const weekEnd = endOfWeek(selectedWeek, {
    weekStartsOn: 1
  });
  const today = new Date();
  const isCurrentWeek = isSameWeek(selectedWeek, today, {
    weekStartsOn: 1
  });

  // Filter outputs for the selected week
  const weekOutputs = weeklyOutputs.filter(output => {
    if (!output.dueDate) return true; // Show outputs without due dates in all weeks
    return isWithinInterval(output.dueDate, {
      start: weekStart,
      end: weekEnd
    });
  });

  // For current week, also include overdue outputs from previous weeks
  const displayOutputs = isCurrentWeek 
    ? [...weekOutputs, ...overdueWeeklyOutputs]
    : weekOutputs;

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };
  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Outputs
            {overdueWeeklyOutputs.length > 0 && isCurrentWeek && (
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
          <DeletedWeeklyOutputsDialog deletedWeeklyOutputs={deletedWeeklyOutputs} onRestore={onRestoreWeeklyOutput} onPermanentlyDelete={onPermanentlyDeleteWeeklyOutput} />
          <AddWeeklyOutputDialog onAddWeeklyOutput={onAddWeeklyOutput} />
        </div>
      </CardHeader>
      <CardContent>
        <WeekNavigator selectedWeek={selectedWeek} onNavigateWeek={navigateWeek} onGoToCurrentWeek={goToCurrentWeek} />

        <div className="space-y-4">
          {displayOutputs.length === 0 ? <p className="text-center text-gray-500 py-4">No weekly outputs for this week</p> : displayOutputs.map(output => <WeeklyOutputCard key={output.id} output={output} onEditWeeklyOutput={onEditWeeklyOutput} onUpdateProgress={onUpdateProgress} onMoveWeeklyOutput={onMoveWeeklyOutput} onDeleteWeeklyOutput={onDeleteWeeklyOutput} />)}
        </div>
      </CardContent>
    </Card>;
};
