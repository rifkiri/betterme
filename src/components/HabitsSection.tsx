
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';
import { Habit } from '@/types/productivity';
import { AddHabitDialog } from './AddHabitDialog';

interface HabitsSectionProps {
  habits: Habit[];
  onAddHabit: (habit: { name: string; description?: string; category?: string }) => void;
  onToggleHabit: (id: string) => void;
}

export const HabitsSection = ({ habits, onAddHabit, onToggleHabit }: HabitsSectionProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daily Habits</CardTitle>
          <CardDescription>Build your streaks</CardDescription>
        </div>
        <AddHabitDialog onAddHabit={onAddHabit} />
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
              <div>
                <span className={`font-medium ${habit.completed ? 'text-green-700' : 'text-gray-700'}`}>
                  {habit.name}
                </span>
                {habit.category && <p className="text-xs text-gray-500">{habit.category}</p>}
              </div>
            </div>
            <div className="text-right">
              <Badge variant={habit.streak > 0 ? 'default' : 'secondary'} className="text-xs">
                {habit.streak} day streak
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
