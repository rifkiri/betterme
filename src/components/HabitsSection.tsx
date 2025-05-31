
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Archive } from 'lucide-react';
import { Habit } from '@/types/productivity';
import { AddHabitDialog } from './AddHabitDialog';
import { ArchivedHabitsDialog } from './ArchivedHabitsDialog';
import { EditHabitDialog } from './EditHabitDialog';

interface HabitsSectionProps {
  habits: Habit[];
  archivedHabits: Habit[];
  onAddHabit: (habit: { name: string; description?: string; category?: string }) => void;
  onEditHabit: (id: string, updates: Partial<Habit>) => void;
  onToggleHabit: (id: string) => void;
  onArchiveHabit: (id: string) => void;
  onRestoreHabit: (id: string) => void;
  onPermanentlyDeleteHabit: (id: string) => void;
}

export const HabitsSection = ({ 
  habits, 
  archivedHabits,
  onAddHabit,
  onEditHabit,
  onToggleHabit, 
  onArchiveHabit,
  onRestoreHabit,
  onPermanentlyDeleteHabit
}: HabitsSectionProps) => {
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daily Habits</CardTitle>
          <CardDescription>Build your streaks</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ArchivedHabitsDialog 
            archivedHabits={archivedHabits}
            onRestoreHabit={onRestoreHabit}
            onPermanentlyDeleteHabit={onPermanentlyDeleteHabit}
          />
          <AddHabitDialog onAddHabit={onAddHabit} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {habits.map(habit => (
          <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <button onClick={() => onToggleHabit(habit.id)}>
                {habit.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <div 
                className="cursor-pointer hover:bg-gray-100 rounded p-1 -m-1 transition-colors"
                onClick={() => setEditingHabit(habit)}
              >
                <span className={`font-medium ${habit.completed ? 'text-green-700' : 'text-gray-700'}`}>
                  {habit.name}
                </span>
                {habit.category && <p className="text-xs text-gray-500">{habit.category}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={habit.streak > 0 ? 'default' : 'secondary'} className="text-xs">
                {habit.streak} day streak
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onArchiveHabit(habit.id)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      
      {editingHabit && (
        <EditHabitDialog
          habit={editingHabit}
          open={true}
          onOpenChange={(open) => !open && setEditingHabit(null)}
          onSave={onEditHabit}
        />
      )}
    </Card>
  );
};
