
import { useState } from 'react';
import { CheckCircle, Circle, Edit, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Habit } from '@/types/productivity';

interface HabitItemProps {
  habit: Habit;
  onToggleHabit: (id: string) => void;
  onEditHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  onArchiveHabit: (id: string) => void;
  onRestoreHabit: (id: string) => void;
  onPermanentlyDeleteHabit: (id: string) => void;
}

export const HabitItem = ({
  habit,
  onToggleHabit,
  onEditHabit,
  onArchiveHabit,
  onRestoreHabit,
  onPermanentlyDeleteHabit
}: HabitItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <button onClick={() => onToggleHabit(habit.id)}>
          {habit.completed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${habit.completed ? 'line-through text-gray-500' : ''}`}>
              {habit.name}
            </p>
            {habit.category && (
              <Badge variant="outline" className="text-xs">
                {habit.category}
              </Badge>
            )}
          </div>
          {habit.description && (
            <p className="text-xs text-gray-500 mt-1">{habit.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">Streak: {habit.streak}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onArchiveHabit(habit.id)}
          className="h-8 w-8 p-0"
          title="Archive habit"
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
