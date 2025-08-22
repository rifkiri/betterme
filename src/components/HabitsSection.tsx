
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Habit } from '@/types/productivity';
import { Goal } from '@/types/productivity';
import { HabitItem } from './HabitItem';
import { AddHabitDialog } from './AddHabitDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HabitsSectionProps {
  habits: Habit[];
  archivedHabits?: Habit[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onToggleHabit: (id: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => Promise<void>;
  onEditHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  onArchiveHabit: (id: string) => void;
  onRestoreHabit: (id: string) => void;
  onPermanentlyDeleteHabit: (id: string) => void;
  goals: Goal[];
}

export const HabitsSection = ({ 
  habits,
  archivedHabits = [],
  selectedDate, 
  onDateChange, 
  onToggleHabit, 
  onAddHabit, 
  onEditHabit, 
  onArchiveHabit, 
  onRestoreHabit,
  onPermanentlyDeleteHabit,
  goals
}: HabitsSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Daily Habits</h2>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateChange}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <AddHabitDialog onAddHabit={onAddHabit} goals={goals} />
        </div>
      </div>
      <div className="space-y-3">
        {habits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
            onToggleHabit={onToggleHabit}
            onEditHabit={onEditHabit}
            onArchiveHabit={onArchiveHabit}
            onRestoreHabit={onRestoreHabit}
            onPermanentlyDeleteHabit={onPermanentlyDeleteHabit}
          />
        ))}
      </div>
    </section>
  );
};
