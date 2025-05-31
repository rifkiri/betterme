
import { useState } from 'react';
import { Habit } from '@/types/productivity';

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Morning Exercise', completed: true, streak: 14, category: 'Health' },
    { id: '2', name: 'Read 30 minutes', completed: true, streak: 12, category: 'Learning' },
    { id: '3', name: 'Meditation', completed: true, streak: 8, category: 'Wellness' },
    { id: '4', name: 'Drink 8 glasses water', completed: false, streak: 3, category: 'Health' },
    { id: '5', name: 'No social media', completed: false, streak: 0, category: 'Productivity' },
  ]);

  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);

  const addHabit = (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      completed: false,
      streak: 0,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const editHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(habit => 
      habit.id === id ? { ...habit, ...updates } : habit
    ));
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(habit => 
      habit.id === id 
        ? { 
            ...habit, 
            completed: !habit.completed,
            streak: !habit.completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)
          }
        : habit
    ));
  };

  const archiveHabit = (id: string) => {
    const habitToArchive = habits.find(habit => habit.id === id);
    if (habitToArchive) {
      setArchivedHabits(prev => [...prev, { ...habitToArchive, archived: true }]);
      setHabits(prev => prev.filter(habit => habit.id !== id));
    }
  };

  const restoreHabit = (id: string) => {
    const habitToRestore = archivedHabits.find(habit => habit.id === id);
    if (habitToRestore) {
      setHabits(prev => [...prev, { ...habitToRestore, archived: false }]);
      setArchivedHabits(prev => prev.filter(habit => habit.id !== id));
    }
  };

  const permanentlyDeleteHabit = (id: string) => {
    setArchivedHabits(prev => prev.filter(habit => habit.id !== id));
  };

  return {
    habits,
    archivedHabits,
    addHabit,
    editHabit,
    toggleHabit,
    archiveHabit,
    restoreHabit,
    permanentlyDeleteHabit,
  };
};
