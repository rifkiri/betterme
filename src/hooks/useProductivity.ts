
import { useState } from 'react';
import { Habit, Task } from '@/types/productivity';

export const useProductivity = () => {
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Morning Exercise', completed: true, streak: 14, category: 'Health' },
    { id: '2', name: 'Read 30 minutes', completed: true, streak: 12, category: 'Learning' },
    { id: '3', name: 'Meditation', completed: true, streak: 8, category: 'Wellness' },
    { id: '4', name: 'Drink 8 glasses water', completed: false, streak: 3, category: 'Health' },
    { id: '5', name: 'No social media', completed: false, streak: 0, category: 'Productivity' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Complete project proposal', priority: 'High', completed: true, estimatedTime: '2h' },
    { id: '2', title: 'Review team feedback', priority: 'Medium', completed: true, estimatedTime: '1h' },
    { id: '3', title: 'Client meeting preparation', priority: 'High', completed: false, estimatedTime: '1.5h' },
    { id: '4', title: 'Update documentation', priority: 'Low', completed: false, estimatedTime: '30m' },
  ]);

  const addHabit = (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      completed: false,
      streak: 0,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
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

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return {
    habits,
    tasks,
    addHabit,
    addTask,
    toggleHabit,
    toggleTask,
  };
};
