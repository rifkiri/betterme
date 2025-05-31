import { useState } from 'react';
import { Task } from '@/types/productivity';
import { getToday, getYesterday, isSameDate, isTaskOverdue, isTaskWithinWeek } from '@/utils/dateUtils';
import { format } from 'date-fns';

export const useTasks = () => {
  const today = getToday();
  const yesterday = getYesterday();
  
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

  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

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

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete) {
      setDeletedTasks(prev => [...prev, taskToDelete]);
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const restoreTask = (id: string) => {
    const taskToRestore = deletedTasks.find(task => task.id === id);
    if (taskToRestore) {
      setTasks(prev => [...prev, taskToRestore]);
      setDeletedTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const permanentlyDeleteTask = (id: string) => {
    setDeletedTasks(prev => prev.filter(task => task.id !== id));
  };

  const rollOverTask = (taskId: string, newDueDate: Date) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const originalDate = task.originalDueDate || task.dueDate;
        const isMovedBackToOriginal = originalDate && 
          isSameDate(newDueDate, originalDate);
        
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
      task.dueDate && isSameDate(task.dueDate, date)
    );
  };

  const getTodaysTasks = () => getTasksByDate(today);
  
  const getOverdueTasks = () => {
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      isTaskOverdue(task.dueDate)
    );
  };

  const getCompletedTasks = () => tasks.filter(task => task.completed);
  const getPendingTasks = () => tasks.filter(task => !task.completed);

  const getCurrentWeekTasks = () => {
    return tasks.filter(task => 
      task.dueDate && 
      isTaskWithinWeek(task.dueDate)
    );
  };

  return {
    tasks,
    deletedTasks,
    addTask,
    toggleTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    rollOverTask,
    getTasksByDate,
    getTodaysTasks,
    getOverdueTasks,
    getCompletedTasks,
    getPendingTasks,
    getCurrentWeekTasks,
  };
};
