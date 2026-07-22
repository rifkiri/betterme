
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Search } from 'lucide-react';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { CompletedWeeklyOutputsDialog } from './CompletedWeeklyOutputsDialog';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { WeeklyOutputCard } from './WeeklyOutputCard';
import { WeekNavigator } from './WeekNavigator';
import { WeeklyOutput, Task, Goal } from '@/types/productivity';
import { format, addWeeks, isWithinInterval, isBefore } from 'date-fns';
import { getBiWeeklyInterval, isSameBiWeek } from '@/utils/dateUtils';

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
  const [selectedPeriod, setSelectedPeriod] = useState(new Date());

  // Filter & sort
  const [searchQuery, setSearchQuery] = useState('');
  const [goalFilter, setGoalFilter] = useState<string>('all'); // 'all' | 'none' | goalId
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [sortBy, setSortBy] = useState<'dueDateAsc' | 'dueDateDesc' | 'progressDesc' | 'progressAsc' | 'title' | 'goal'>('dueDateAsc');

  const goalById = useMemo(() => {
    const m = new Map<string, Goal>();
    goals.forEach(g => m.set(g.id, g));
    return m;
  }, [goals]);

  const applyFiltersAndSort = (list: WeeklyOutput[]) => {
    let out = list.filter(o => {
      if (goalFilter === 'none' && o.linkedGoalId) return false;
      if (goalFilter !== 'all' && goalFilter !== 'none' && o.linkedGoalId !== goalFilter) return false;
      if (statusFilter === 'completed' && o.progress < 100) return false;
      if (statusFilter === 'in_progress' && (o.progress >= 100 || o.progress === 0)) return false;
      if (statusFilter === 'not_started' && o.progress !== 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!o.title.toLowerCase().includes(q) && !(o.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sortBy) {
        case 'dueDateDesc': return (b.dueDate?.getTime() || 0) - (a.dueDate?.getTime() || 0);
        case 'progressDesc': return b.progress - a.progress;
        case 'progressAsc': return a.progress - b.progress;
        case 'title': return a.title.localeCompare(b.title);
        case 'goal': {
          const an = a.linkedGoalId ? goalById.get(a.linkedGoalId)?.title || '' : '';
          const bn = b.linkedGoalId ? goalById.get(b.linkedGoalId)?.title || '' : '';
          return an.localeCompare(bn);
        }
        case 'dueDateAsc':
        default:
          return (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity);
      }
    });
    return out;
  };

  // Get bi-weekly (2-week) interval
  const { start: periodStart, end: periodEnd } = getBiWeeklyInterval(selectedPeriod);
  const today = new Date();
  const isCurrentPeriod = isSameBiWeek(selectedPeriod, today);

  // Enhanced filtering for outputs in the selected bi-weekly period
  const getOutputsForSelectedPeriod = () => {
    return weeklyOutputs.filter(output => {
      if (output.dueDate && isWithinInterval(output.dueDate, { start: periodStart, end: periodEnd })) return true;
      if (output.progress >= 100 && output.completedDate && isWithinInterval(output.completedDate, { start: periodStart, end: periodEnd })) return true;
      if (!output.dueDate) return true;
      return false;
    });
  };

  const periodOutputs = applyFiltersAndSort(getOutputsForSelectedPeriod());

  // For current period, show incomplete outputs from previous periods that are truly overdue
  const rolledOverOutputs = isCurrentPeriod ? applyFiltersAndSort(weeklyOutputs.filter(output => {
    if (!output.dueDate || output.progress >= 100) return false;
    if (!isBefore(output.dueDate, today)) return false;
    return !isWithinInterval(output.dueDate, { start: periodStart, end: periodEnd });
  })) : [];

  // Navigate by 1 week for rolling bi-weekly
  const navigatePeriod = (direction: 'prev' | 'next') => {
    setSelectedPeriod(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  const goToCurrentPeriod = () => {
    setSelectedPeriod(new Date());
  };

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-4 pb-2 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">
            <span className="truncate">Bi-Weekly Outputs</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isCurrentPeriod ? 'This Period' : format(periodStart, 'MMM dd')} - {format(periodEnd, 'MMM dd, yyyy')}
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
          selectedWeek={selectedPeriod} 
          onNavigateWeek={navigatePeriod} 
          onGoToCurrentWeek={goToCurrentPeriod} 
          biWeekly={true}
        />

        <div className="space-y-3 sm:space-y-6">
          {/* Current period outputs */}
          <div>
            {periodOutputs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">No bi-weekly outputs for this period</p>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {periodOutputs.map(output => (
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

          {/* Rolled over outputs section (only show in current period and only incomplete ones) */}
          {isCurrentPeriod && rolledOverOutputs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-600 mb-2 sm:mb-3 flex items-center gap-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Rolled Over from Previous Periods</span>
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
