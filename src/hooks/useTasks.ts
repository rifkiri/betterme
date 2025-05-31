
import { useState } from 'react';
import { Task } from '@/types/productivity';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Complete project proposal', 
      priority: 'High', 
      completed: true, 
      estimatedTime: '2h',
      createdDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      weeklyOutputId: '1'
    },
    { 
      id: '2', 
      title: 'Review team feedback', 
      priority: 'Medium', 
      completed: true, 
      estimatedTime: '1h',
      createdDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      weeklyOutputId: '1'
    },
    { 
      id: '3', 
      title: 'Client meeting preparation', 
      priority: 'High', 
      completed: false, 
      estimatedTime: '1.5h',
      createdDate: new Date(),
      weeklyOutputId: '2'
    },
    { 
      id: '4', 
      title: 'Update documentation', 
      priority: 'Low', 
      completed: false, 
      estimatedTime: '30m',
      createdDate: new Date(),
      weeklyOutputId: '2'
    },
    {
      id: '5',
      title: 'Marketing campaign research',
      priority: 'Medium',
      completed: false,
      estimatedTime: '1h',
      createdDate: new Date(),
      weeklyOutputId: '4'
    }
  ]);

  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdDate: new Date(),
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

  const getTasksByWeeklyOutput = (weeklyOutputId: string) => {
    return tasks.filter(task => task.weeklyOutputId === weeklyOutputId);
  };

  const getCompletedTasks = () => tasks.filter(task => task.completed);
  const getPendingTasks = () => tasks.filter(task => !task.completed);

  return {
    tasks,
    deletedTasks,
    addTask,
    toggleTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    getTasksByWeeklyOutput,
    getCompletedTasks,
    getPendingTasks,
  };
};
