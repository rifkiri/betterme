
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { WeeklyOutput, Project } from '@/types/productivity';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { WeeklyOutputCard } from './WeeklyOutputCard';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { WeekNavigator } from './WeekNavigator';
import { startOfWeek, endOfWeek, isSameWeek, addWeeks, subWeeks } from 'date-fns';

interface WeeklyOutputsSectionProps {
  weeklyOutputs: WeeklyOutput[];
  deletedWeeklyOutputs: WeeklyOutput[];
  overdueWeeklyOutputs: WeeklyOutput[];
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => void;
  onEditOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onDeleteOutput: (id: string) => void;
  onRestoreWeeklyOutput: (id: string) => void;
  onPermanentlyDeleteWeeklyOutput: (id: string) => void;
  onMoveWeeklyOutput: (id: string, newDueDate: Date) => void;
  projects?: Project[];
}

export const WeeklyOutputsSection = ({
  weeklyOutputs,
  deletedWeeklyOutputs,
  overdueWeeklyOutputs,
  onAddWeeklyOutput,
  onEditOutput,
  onUpdateProgress,
  onDeleteOutput,
  onRestoreWeeklyOutput,
  onPermanentlyDeleteWeeklyOutput,
  onMoveWeeklyOutput,
  projects = []
}: WeeklyOutputsSectionProps) => {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [showDeletedOutputs, setShowDeletedOutputs] = useState(false);

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedWeek(subWeeks(selectedWeek, 1));
    } else {
      setSelectedWeek(addWeeks(selectedWeek, 1));
    }
  };

  const handleGoToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  // Filter outputs for the selected week
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const currentWeekOutputs = weeklyOutputs.filter(output => {
    if (!output.dueDate) return false;
    return isSameWeek(output.dueDate, selectedWeek, { weekStartsOn: 1 });
  });

  // Get rolled over outputs (from previous weeks that are incomplete)
  const rolledOverOutputs = weeklyOutputs.filter(output => {
    if (!output.dueDate || output.progress === 100) return false;
    return output.dueDate < weekStart && !output.isMoved;
  });

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              📊 Weekly Outputs
              {overdueWeeklyOutputs.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueWeeklyOutputs.length} overdue
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeletedOutputs(true)}
              className="flex items-center gap-2 text-xs px-2 py-1"
            >
              <Trash2 className="h-3 w-3" />
              Deleted ({deletedWeeklyOutputs.length})
            </Button>
            <AddWeeklyOutputDialog 
              onAddWeeklyOutput={onAddWeeklyOutput} 
              projects={projects}
              buttonText="Add Outputs"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Week Navigator */}
        <WeekNavigator
          selectedWeek={selectedWeek}
          onNavigateWeek={handleNavigateWeek}
          onGoToCurrentWeek={handleGoToCurrentWeek}
        />

        {/* Rolled Over from Previous Weeks */}
        {rolledOverOutputs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-orange-600 flex items-center gap-2">
              🔄 Rolled Over from Previous Weeks ({rolledOverOutputs.length})
            </h3>
            <div className="space-y-2">
              {rolledOverOutputs.map((output) => (
                <WeeklyOutputCard
                  key={output.id}
                  output={output}
                  onEditOutput={onEditOutput}
                  onUpdateProgress={onUpdateProgress}
                  onDeleteOutput={onDeleteOutput}
                  onMoveOutput={onMoveWeeklyOutput}
                  projects={projects}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Week Outputs */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            This Week ({currentWeekOutputs.length})
          </h3>
          {currentWeekOutputs.length > 0 ? (
            <div className="space-y-2">
              {currentWeekOutputs.map((output) => (
                <WeeklyOutputCard
                  key={output.id}
                  output={output}
                  onEditOutput={onEditOutput}
                  onUpdateProgress={onUpdateProgress}
                  onDeleteOutput={onDeleteOutput}
                  onMoveOutput={onMoveWeeklyOutput}
                  projects={projects}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No outputs for this week</p>
              <p className="text-xs mt-1">Add your first output to get started!</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Deleted Outputs Dialog */}
      {showDeletedOutputs && (
        <DeletedWeeklyOutputsDialog
          open={showDeletedOutputs}
          onOpenChange={setShowDeletedOutputs}
          deletedWeeklyOutputs={deletedWeeklyOutputs}
          onRestore={onRestoreWeeklyOutput}
          onPermanentlyDelete={onPermanentlyDeleteWeeklyOutput}
          title="Deleted Weekly Outputs"
        />
      )}
    </Card>
  );
};
