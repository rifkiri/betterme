
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { Habit } from '@/types/productivity';

interface ArchivedHabitsDialogProps {
  archivedHabits: Habit[];
  onRestoreHabit: (id: string) => void;
  onPermanentlyDeleteHabit: (id: string) => void;
}

export const ArchivedHabitsDialog = ({ 
  archivedHabits, 
  onRestoreHabit, 
  onPermanentlyDeleteHabit 
}: ArchivedHabitsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Archived ({archivedHabits.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Archived Habits</DialogTitle>
          <DialogDescription>
            Restore or permanently delete your archived habits
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {archivedHabits.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No archived habits</p>
          ) : (
            archivedHabits.map(habit => (
              <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-700">{habit.name}</span>
                  {habit.category && (
                    <p className="text-xs text-gray-500">{habit.category}</p>
                  )}
                  <Badge variant="secondary" className="text-xs mt-1">
                    {habit.streak} day streak
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestoreHabit(habit.id)}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    title="Restore habit"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPermanentlyDeleteHabit(habit.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    title="Permanently delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
