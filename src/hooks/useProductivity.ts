import { useState } from 'react';
import { Habit, Task, WeeklyPlan } from '@/types/productivity';
import { format, startOfWeek, endOfWeek, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';

export const useProductivity = () => {
  const today = new Date();
  const yesterday = addDays(today, -1);
  
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Morning Exercise', completed: true, streak: 14, category: 'Health' },
    { id: '2', name: 'Read 30 minutes', completed: true, streak: 12, category: 'Learning' },
    { id: '3', name: 'Meditation', completed: true, streak: 8, category: 'Wellness' },
    { id: '4', name: 'Drink 8 glasses water', completed: false, streak: 3, category: 'Health' },
    { id: '5', name: 'No social media', completed: false, streak: 0, category: 'Productivity' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Complete project proposal', 
      priority: 'High', 
      completed: true, 
      estimatedTime: '2h',
      createdDate: yesterday,
      dueDate: yesterday,
      originalDueDate: yesterday,
      completedDate: yesterday,
      isMoved: false
    },
    { 
      id: '2', 
      title: 'Review team feedback', 
      priority: 'Medium', 
      completed: true, 
      estimatedTime: '1h',
      createdDate: yesterday,
      dueDate: yesterday,
      originalDueDate: yesterday,
      completedDate: yesterday,
      isMoved: false
    },
    { 
      id: '3', 
      title: 'Client meeting preparation', 
      priority: 'High', 
      completed: false, 
      estimatedTime: '1.5h',
      createdDate: today,
      dueDate: today,
      originalDueDate: today,
      isMoved: false
    },
    { 
      id: '4', 
      title: 'Update documentation', 
      priority: 'Low', 
      completed: false, 
      estimatedTime: '30m',
      createdDate: today,
      dueDate: today,
      originalDueDate: today,
      isMoved: false
    },
    {
      id: '5',
      title: 'Unfinished task from yesterday',
      priority: 'Medium',
      completed: false,
      estimatedTime: '1h',
      createdDate: yesterday,
      dueDate: yesterday,
      originalDueDate: yesterday,
      isMoved: false
    }
  ]);

  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);

  const addHabit = (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      completed: false,
      streak: 0,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdDate: new Date(),
      dueDate: task.dueDate || new Date(),
      originalDueDate: task.dueDate || new Date(),
      isMoved: false,
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
      task.id === id 
        ? { 
            ...task, 
            completed: !task.completed,
            completedDate: !task.completed ? new Date() : undefined
          } 
        : task
    ));
  };

  const rollOverTask = (taskId: string, newDueDate: Date) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const originalDate = task.originalDueDate || task.dueDate;
        const isMovedBackToOriginal = originalDate && 
          format(newDueDate, 'yyyy-MM-dd') === format(originalDate, 'yyyy-MM-dd');
        
        return { 
          ...task, 
          dueDate: newDueDate,
          originalDueDate: task.originalDueDate || task.dueDate,
          isMoved: !isMovedBackToOriginal
        };
      }
      return task;
    }));
  };

  const getTasksByDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && format(task.dueDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getTodaysTasks = () => getTasksByDate(today);
  const getOverdueTasks = () => {
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate < today && 
      !isToday(task.dueDate)
    );
  };

  const getCompletedTasks = () => tasks.filter(task => task.completed);
  const getPendingTasks = () => tasks.filter(task => !task.completed);

  const getCurrentWeekTasks = () => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    return tasks.filter(task => 
      task.dueDate && 
      isWithinInterval(task.dueDate, { start: weekStart, end: weekEnd })
    );
  };

  const createWeeklyPlan = (plan: Omit<WeeklyPlan, 'id'>) => {
    const newPlan: WeeklyPlan = {
      ...plan,
      id: Date.now().toString(),
    };
    setWeeklyPlans(prev => [...prev, newPlan]);
  };

  return {
    habits,
    tasks,
    weeklyPlans,
    addHabit,
    addTask,
    toggleHabit,
    toggleTask,
    rollOverTask,
    getTasksByDate,
    getTodaysTasks,
    getOverdueTasks,
    getCompletedTasks,
    getPendingTasks,
    getCurrentWeekTasks,
    createWeeklyPlan,
  };
};
