
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Archive, Loader2, Eye, Link } from 'lucide-react';
import { Habit, Goal } from '@/types/productivity';
// Fixed habit-goal linking functionality
import { AddHabitDialog } from './AddHabitDialog';
import { ArchivedHabitsDialog } from './ArchivedHabitsDialog';
import { EditHabitDialog } from './EditHabitDialog';
import { HabitDetailsDialog } from './HabitDetailsDialog';
import { StreakDatesDialog } from './StreakDatesDialog';
import { DateNavigator } from './DateNavigator';
import { mapDatabaseToDisplay } from '@/utils/habitCategoryUtils';
import { format, isToday } from 'date-fns';

interface HabitsSectionProps {
  habits: Habit[];
  archivedHabits: Habit[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => void;
  onEditHabit: (id: string, updates: Partial<Habit>) => void;
  onToggleHabit: (id: string) => void;
  onArchiveHabit: (id: string) => void;
  onRestoreHabit: (id: string) => void;
  onPermanentlyDeleteHabit: (id: string) => void;
  isLoading?: boolean;
  goals?: Goal[];
}

export const HabitsSection = ({ 
  habits, 
  archivedHabits,
  selectedDate,
  onDateChange,
  onAddHabit,
  onEditHabit,
  onToggleHabit, 
  onArchiveHabit,
  onRestoreHabit,
  onPermanentlyDeleteHabit,
  isLoading = false,
  goals = []
}: HabitsSectionProps) => {
  const [togglingHabitId, setTogglingHabitId] = useState<string | null>(null);
  const [streakDialogHabit, setStreakDialogHabit] = useState<Habit | null>(null);
  const [viewingHabitId, setViewingHabitId] = useState<string | null>(null);


  const handleToggleHabit = async (id: string) => {
    console.log('Toggling habit:', id);
    setTogglingHabitId(id);
    try {
      await onToggleHabit(id);
    } finally {
      setTogglingHabitId(null);
    }
  };

  const handleStreakClick = (habit: Habit) => {
    if (habit.streak > 0) {
      setStreakDialogHabit(habit);
    }
  };

  const handleEditHabit = async (id: string, updates: Partial<Habit>) => {
    await onEditHabit(id, updates);
    // No need to update local state since we get fresh data from habits array
  };

  const today = isToday(selectedDate);

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>
            {today ? 'Daily Habits' : `Habits for ${format(selectedDate, 'MMM d, yyyy')}`}
          </CardTitle>
          <CardDescription>
            {today ? 'Build your streaks' : 'View and track past habits'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ArchivedHabitsDialog 
            archivedHabits={archivedHabits}
            onRestoreHabit={onRestoreHabit}
            onPermanentlyDeleteHabit={onPermanentlyDeleteHabit}
          />
          <AddHabitDialog onAddHabit={onAddHabit} goals={goals} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <DateNavigator 
          selectedDate={selectedDate} 
          onDateChange={onDateChange} 
        />
        
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>Loading habits...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No habits yet. Add your first habit to start building streaks!</p>
          </div>
        ) : (
          <div key={`habits-${habits.length}-goals-${goals.length}`}>
            {habits.map(habit => (
            <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleToggleHabit(habit.id)}
                  disabled={togglingHabitId === habit.id}
                  className="disabled:opacity-50"
                >
                  {togglingHabitId === habit.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : habit.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${habit.completed ? 'text-green-700' : 'text-gray-700'}`}>
                      {habit.name}
                    </span>
                    {habit.linkedGoalId && goals.find(g => g.id === habit.linkedGoalId) && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200">
                        <Link className="h-2 w-2" />
                        {goals.find(g => g.id === habit.linkedGoalId)?.title}
                      </Badge>
                    )}
                  </div>
                  {habit.category && <p className="text-xs text-gray-500">{mapDatabaseToDisplay(habit.category)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={habit.streak > 0 ? 'default' : 'secondary'} 
                  className={`text-xs ${habit.streak > 0 ? 'cursor-pointer hover:bg-primary/80' : ''}`}
                  onClick={() => handleStreakClick(habit)}
                >
                  {habit.streak} day streak
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingHabitId(habit.id)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchiveHabit(habit.id)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="Archive Habit"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>

      {streakDialogHabit && (
        <StreakDatesDialog
          habitId={streakDialogHabit.id}
          habitName={streakDialogHabit.name}
          streak={streakDialogHabit.streak}
          open={true}
          onOpenChange={(open) => !open && setStreakDialogHabit(null)}
        />
      )}

      {viewingHabitId && (() => {
        const currentHabit = habits.find(h => h.id === viewingHabitId);
        return currentHabit ? (
          <HabitDetailsDialog
            habit={currentHabit}
            goals={goals}
            open={true}
            onOpenChange={(open) => !open && setViewingHabitId(null)}
            onEditHabit={handleEditHabit}
          />
        ) : null;
      })()}
    </Card>
  );
};
