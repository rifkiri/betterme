import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Check, X, Edit, Trash2, Calendar, Target } from 'lucide-react';
import { HabitDialog } from './HabitDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { format, isToday } from 'date-fns';
import type { Habit } from '@/types/productivity';

interface HabitsSectionProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, completed: boolean) => void;
  onAddHabit: (habit: Omit<Habit, 'id'>) => void;
  onEditHabit: (habitId: string, updates: Partial<Habit>) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsSection: React.FC<HabitsSectionProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const handleViewStreak = (habitId: string) => {
    console.log('View streak for habit:', habitId);
    // Could show a simple toast or modal with streak info
  };

  const handleToggleHabit = (habit: Habit) => {
    const newCompleted = !habit.completed;
    onToggleHabit(habit.id, newCompleted);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const handleDeleteHabit = (habit: Habit) => {
    setDeletingHabit(habit);
  };

  const confirmDelete = () => {
    if (deletingHabit) {
      onDeleteHabit(deletingHabit.id);
      setDeletingHabit(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: 'bg-green-100 text-green-800',
      fitness: 'bg-blue-100 text-blue-800',
      productivity: 'bg-purple-100 text-purple-800',
      personal: 'bg-orange-100 text-orange-800',
      learning: 'bg-indigo-100 text-indigo-800',
      mental: 'bg-pink-100 text-pink-800',
      relationship: 'bg-red-100 text-red-800',
      social: 'bg-yellow-100 text-yellow-800',
      spiritual: 'bg-teal-100 text-teal-800',
      wealth: 'bg-emerald-100 text-emerald-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const getStreakStatus = (habit: Habit) => {
    if (habit.streak === 0) return 'No streak';
    if (habit.streak === 1) return '1 day';
    return `${habit.streak} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Habits</h2>
          <p className="text-gray-600">Build consistency with daily habits</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Start building positive habits to improve your daily routine
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <Card key={habit.id} className={`transition-all duration-200 ${
              habit.completed ? 'ring-2 ring-green-200 bg-green-50' : 'hover:shadow-md'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium">{habit.name}</CardTitle>
                    {habit.description && (
                      <CardDescription className="mt-1">{habit.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditHabit(habit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHabit(habit)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(habit.category || 'other')}>
                    {habit.category || 'Other'}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{getStreakStatus(habit)}</span>
                  </div>
                </div>

                {habit.streak > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Streak Progress</span>
                      <span className="font-medium">{habit.streak} days</span>
                    </div>
                    <Progress value={Math.min((habit.streak / 30) * 100, 100)} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant={habit.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleHabit(habit)}
                    className={`flex items-center gap-2 ${
                      habit.completed 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                    }`}
                  >
                    {habit.completed ? (
                      <>
                        <Check className="h-4 w-4" />
                        Completed
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Mark Done
                      </>
                    )}
                  </Button>

                  {habit.streak > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewStreak(habit.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View Streak
                    </Button>
                  )}
                </div>

                {habit.lastCompletedDate && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Last completed: {
                      isToday(new Date(habit.lastCompletedDate))
                        ? 'Today'
                        : format(new Date(habit.lastCompletedDate), 'MMM d, yyyy')
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HabitDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={onAddHabit}
      />

      <HabitDialog
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
        habit={editingHabit}
        onSave={(updates) => {
          if (editingHabit) {
            onEditHabit(editingHabit.id, updates);
            setEditingHabit(null);
          }
        }}
      />

      <DeleteConfirmationDialog
        open={!!deletingHabit}
        onOpenChange={(open) => !open && setDeletingHabit(null)}
        onConfirm={confirmDelete}
        title="Delete Habit"
        description={`Are you sure you want to delete "${deletingHabit?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};
