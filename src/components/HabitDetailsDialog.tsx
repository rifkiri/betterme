import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Edit2, Calendar, Award, Target, Link } from 'lucide-react';
import { Habit } from '@/types/productivity';
import { EditHabitDialog } from './EditHabitDialog';
import { mapDatabaseToDisplay } from '@/utils/habitCategoryUtils';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { format } from 'date-fns';

interface HabitDetailsDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditHabit: (id: string, updates: Partial<Habit>) => void;
}

export const HabitDetailsDialog = ({
  habit,
  open,
  onOpenChange,
  onEditHabit
}: HabitDetailsDialogProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentHabit, setCurrentHabit] = useState<Habit>(habit);
  const { goals } = useGoals();
  const { habits } = useHabits();

  // Refresh habit data when dialog opens or habit changes
  useEffect(() => {
    if (habit && open) {
      const updatedHabit = habits.find(h => h.id === habit.id) || habit;
      setCurrentHabit(updatedHabit);
    }
  }, [habit, open, habits]);

  // Find the linked goal if one exists
  const linkedGoal = currentHabit.linkedGoalId 
    ? goals?.find(goal => goal.id === currentHabit.linkedGoalId)
    : null;

  console.log('HabitDetailsDialog - Habit:', currentHabit.name, 'linkedGoalId:', currentHabit.linkedGoalId);
  console.log('HabitDetailsDialog - Available goals:', goals?.length || 0, goals?.map(g => ({ id: g.id, title: g.title })));
  console.log('HabitDetailsDialog - Found linkedGoal:', linkedGoal);

  const handleEditSave = (habitId: string, updates: Partial<Habit>) => {
    console.log('HabitDetailsDialog - handleEditSave called with:', { habitId, updates });
    console.log('HabitDetailsDialog - Current habit before update:', currentHabit);
    onEditHabit(habitId, updates);
    setShowEditDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentHabit.name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-6">
            <div className="space-y-6">
              {/* Category */}
              {currentHabit.category && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Category</h4>
                  <Badge variant="outline">
                    {mapDatabaseToDisplay(currentHabit.category)}
                  </Badge>
                </div>
              )}

              {/* Linked Goal */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Linked Goal
                </h4>
                {linkedGoal ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{linkedGoal.title}</div>
                        <div className="text-xs text-muted-foreground">Progress: {linkedGoal.progress}%</div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs shrink-0">
                        personal
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">No goal linked</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {currentHabit.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentHabit.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Streak Information */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Streak Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                    <Badge variant={currentHabit.streak > 0 ? 'default' : 'secondary'}>
                      {currentHabit.streak} {currentHabit.streak === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={currentHabit.completed ? 'default' : 'outline'}>
                      {currentHabit.completed ? 'Completed Today' : 'Not Completed Today'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Created Date */}
              {currentHabit.createdAt && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentHabit.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setShowEditDialog(true)} className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <EditHabitDialog
          habit={currentHabit}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleEditSave}
        />
      )}
    </>
  );
};