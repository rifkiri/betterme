
import { useState, useEffect } from 'react';
import { localDataService } from '@/services/LocalDataService';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';

export const useProductivity = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const authUser = localStorage.getItem('authUser');
    return authUser ? JSON.parse(authUser).id : null;
  };

  const userId = getCurrentUserId();

  // Load all data from local storage
  const loadAllData = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      const [habitsData, tasksData, weeklyOutputsData] = await Promise.all([
        Promise.resolve(localDataService.getHabits(userId)),
        Promise.resolve(localDataService.getTasks(userId)),
        Promise.resolve(localDataService.getWeeklyOutputs(userId))
      ]);

      setHabits(habitsData.filter(h => !h.archived && !h.isDeleted));
      setArchivedHabits(habitsData.filter(h => h.archived));
      setTasks(tasksData.filter(t => !t.isDeleted));
      setDeletedTasks(tasksData.filter(t => t.isDeleted));
      setWeeklyOutputs(weeklyOutputsData.filter(w => !w.isDeleted));
      setDeletedWeeklyOutputs(weeklyOutputsData.filter(w => w.isDeleted));
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [userId]);

  // Habits methods
  const addHabit = async (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
    if (!userId) return;

    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      completed: false,
      streak: 0,
    };

    try {
      localDataService.addHabit({ ...newHabit, userId });
      await loadAllData();
      toast.success('Habit added successfully');
    } catch (error) {
      toast.error('Failed to add habit');
      setHabits(prev => [...prev, newHabit]);
    }
  };

  const editHabit = async (id: string, updates: Partial<Habit>) => {
    if (!userId) return;

    try {
      localDataService.updateHabit(id, userId, updates);
      await loadAllData();
      toast.success('Habit updated successfully');
    } catch (error) {
      toast.error('Failed to update habit');
      setHabits(prev => prev.map(habit => 
        habit.id === id ? { ...habit, ...updates } : habit
      ));
    }
  };

  const toggleHabit = async (id: string) => {
    if (!userId) return;

    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const updates = {
      completed: !habit.completed,
      streak: !habit.completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)
    };

    try {
      localDataService.updateHabit(id, userId, updates);
      await loadAllData();
    } catch (error) {
      toast.error('Failed to update habit');
      setHabits(prev => prev.map(habit => 
        habit.id === id ? { ...habit, ...updates } : habit
      ));
    }
  };

  const archiveHabit = async (id: string) => {
    if (!userId) return;

    try {
      localDataService.updateHabit(id, userId, { archived: true });
      await loadAllData();
      toast.success('Habit archived');
    } catch (error) {
      toast.error('Failed to archive habit');
      const habitToArchive = habits.find(habit => habit.id === id);
      if (habitToArchive) {
        setArchivedHabits(prev => [...prev, { ...habitToArchive, archived: true }]);
        setHabits(prev => prev.filter(habit => habit.id !== id));
      }
    }
  };

  const restoreHabit = async (id: string) => {
    if (!userId) return;

    try {
      localDataService.updateHabit(id, userId, { archived: false });
      await loadAllData();
      toast.success('Habit restored');
    } catch (error) {
      toast.error('Failed to restore habit');
      const habitToRestore = archivedHabits.find(habit => habit.id === id);
      if (habitToRestore) {
        setHabits(prev => [...prev, { ...habitToRestore, archived: false }]);
        setArchivedHabits(prev => prev.filter(habit => habit.id !== id));
      }
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    setArchivedHabits(prev => prev.filter(habit => habit.id !== id));
    toast.success('Habit permanently deleted');
  };

  // Tasks methods
  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => {
    if (!userId) return;

    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdDate: new Date(),
      dueDate: task.dueDate || new Date(),
      originalDueDate: task.dueDate || new Date(),
      isMoved: false,
    };

    try {
      localDataService.addTask({ ...newTask, userId });
      await loadAllData();
      toast.success('Task added successfully');
    } catch (error) {
      toast.error('Failed to add task');
      setTasks(prev => [...prev, newTask]);
    }
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;

    try {
      localDataService.updateTask(id, userId, updates);
      await loadAllData();
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    }
  };

  const toggleTask = async (id: string) => {
    if (!userId) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates = {
      completed: !task.completed,
      completedDate: !task.completed ? new Date() : undefined
    };

    try {
      localDataService.updateTask(id, userId, updates);
      await loadAllData();
    } catch (error) {
      toast.error('Failed to update task');
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    }
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;

    try {
      localDataService.updateTask(id, userId, { isDeleted: true, deletedDate: new Date() });
      await loadAllData();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
      const taskToDelete = tasks.find(task => task.id === id);
      if (taskToDelete) {
        setDeletedTasks(prev => [...prev, taskToDelete]);
        setTasks(prev => prev.filter(task => task.id !== id));
      }
    }
  };

  const restoreTask = async (id: string) => {
    if (!userId) return;

    try {
      localDataService.updateTask(id, userId, { isDeleted: false, deletedDate: undefined });
      await loadAllData();
      toast.success('Task restored');
    } catch (error) {
      toast.error('Failed to restore task');
      const taskToRestore = deletedTasks.find(task => task.id === id);
      if (taskToRestore) {
        setTasks(prev => [...prev, taskToRestore]);
        setDeletedTasks(prev => prev.filter(task => task.id !== id));
      }
    }
  };

  const permanentlyDeleteTask = async (id: string) => {
    setDeletedTasks(prev => prev.filter(task => task.id !== id));
    toast.success('Task permanently deleted');
  };

  const rollOverTask = async (taskId: string, newDueDate: Date) => {
    if (!userId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const originalDate = task.originalDueDate || task.dueDate;
    const isMovedBackToOriginal = originalDate && 
      originalDate.toDateString() === newDueDate.toDateString();

    const updates = {
      dueDate: newDueDate,
      originalDueDate: task.originalDueDate || task.dueDate,
      isMoved: !isMovedBackToOriginal
    };

    try {
      localDataService.updateTask(taskId, userId, updates);
      await loadAllData();
      toast.success('Task moved successfully');
    } catch (error) {
      toast.error('Failed to move task');
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    }
  };

  // Weekly Outputs methods
  const addWeeklyOutput = async (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    const newOutput: WeeklyOutput = {
      ...output,
      id: Date.now().toString(),
      createdDate: new Date(),
    };

    console.log('Adding weekly output:', newOutput);

    try {
      console.log('Attempting to save locally...');
      localDataService.addWeeklyOutput({ ...newOutput, userId });
      console.log('Successfully saved locally, reloading data...');
      await loadAllData();
      toast.success('Weekly output added successfully');
    } catch (error) {
      console.error('Failed to save weekly output:', error);
      toast.error('Failed to save weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setWeeklyOutputs(prev => [...prev, newOutput]);
    }
  };

  const editWeeklyOutput = async (id: string, updates: Partial<WeeklyOutput>) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    console.log('Editing weekly output:', { id, updates });

    try {
      console.log('Attempting to update locally...');
      localDataService.updateWeeklyOutput(id, userId, updates);
      console.log('Successfully updated locally, reloading data...');
      await loadAllData();
      toast.success('Weekly output updated successfully');
    } catch (error) {
      console.error('Failed to update weekly output:', error);
      toast.error('Failed to update weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setWeeklyOutputs(prev => prev.map(output => 
        output.id === id ? { ...output, ...updates } : output
      ));
    }
  };

  const updateProgress = async (outputId: string, newProgress: number) => {
    if (!userId) return;

    const output = weeklyOutputs.find(o => o.id === outputId);
    if (!output) return;

    const newProgressValue = Math.max(0, Math.min(100, newProgress));
    const updates: Partial<WeeklyOutput> = { progress: newProgressValue };

    if (newProgressValue === 100 && output.progress < 100) {
      updates.completedDate = new Date();
    } else if (newProgressValue < 100 && output.progress === 100) {
      updates.completedDate = undefined;
    }

    await editWeeklyOutput(outputId, updates);
  };

  const moveWeeklyOutput = async (id: string, newDueDate: Date) => {
    if (!userId) return;

    const output = weeklyOutputs.find(o => o.id === id);
    if (!output) return;

    const updates = {
      dueDate: newDueDate,
      originalDueDate: output.originalDueDate || output.dueDate,
      isMoved: true
    };

    await editWeeklyOutput(id, updates);
  };

  const deleteWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      localDataService.updateWeeklyOutput(id, userId, { isDeleted: true, deletedDate: new Date() });
      await loadAllData();
      toast.success('Weekly output deleted');
    } catch (error) {
      toast.error('Failed to delete weekly output');
      const outputToDelete = weeklyOutputs.find(output => output.id === id);
      if (outputToDelete) {
        setDeletedWeeklyOutputs(prev => [...prev, { ...outputToDelete, isDeleted: true, deletedDate: new Date() }]);
        setWeeklyOutputs(prev => prev.filter(output => output.id !== id));
      }
    }
  };

  const restoreWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      localDataService.updateWeeklyOutput(id, userId, { isDeleted: false, deletedDate: undefined });
      await loadAllData();
      toast.success('Weekly output restored');
    } catch (error) {
      toast.error('Failed to restore weekly output');
      const outputToRestore = deletedWeeklyOutputs.find(output => output.id === id);
      if (outputToRestore) {
        const restoredOutput = { ...outputToRestore, isDeleted: false, deletedDate: undefined };
        setWeeklyOutputs(prev => [...prev, restoredOutput]);
        setDeletedWeeklyOutputs(prev => prev.filter(output => output.id !== id));
      }
    }
  };

  const permanentlyDeleteWeeklyOutput = async (id: string) => {
    setDeletedWeeklyOutputs(prev => prev.filter(output => output.id !== id));
    toast.success('Weekly output permanently deleted');
  };

  // Helper methods for filtering data
  const getTasksByDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && task.dueDate.toDateString() === date.toDateString()
    );
  };

  const getTodaysTasks = () => getTasksByDate(new Date());
  
  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate < today
    );
  };

  const getCompletedTasks = () => tasks.filter(task => task.completed);
  const getPendingTasks = () => tasks.filter(task => !task.completed);

  const getCurrentWeekTasks = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate >= startOfWeek && 
      task.dueDate <= endOfWeek
    );
  };

  const getOverdueWeeklyOutputs = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return weeklyOutputs.filter(output => 
      output.dueDate && 
      output.dueDate < today && 
      output.progress < 100 && 
      !output.completedDate
    );
  };

  return {
    // State
    habits,
    archivedHabits,
    tasks,
    deletedTasks,
    weeklyOutputs,
    deletedWeeklyOutputs,
    isLoading,
    
    // Methods
    loadAllData,
    
    // Habits
    addHabit,
    editHabit,
    toggleHabit,
    archiveHabit,
    restoreHabit,
    permanentlyDeleteHabit,
    
    // Tasks
    addTask,
    editTask,
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
    
    // Weekly Outputs
    addWeeklyOutput,
    editWeeklyOutput,
    updateProgress,
    moveWeeklyOutput,
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
    getOverdueWeeklyOutputs,
  };
};
