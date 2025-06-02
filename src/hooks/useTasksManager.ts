
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { Task } from '@/types/productivity';
import { toast } from 'sonner';

interface UseTasksManagerProps {
  userId: string | null;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  deletedTasks: Task[];
  setDeletedTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

export const useTasksManager = ({
  userId,
  isGoogleSheetsAvailable,
  loadAllData,
  tasks,
  setTasks,
  deletedTasks,
  setDeletedTasks,
}: UseTasksManagerProps) => {
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.addTask({ ...newTask, userId });
        await loadAllData();
        toast.success('Task added successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to add task');
      setTasks(prev => [...prev, newTask]);
    }
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateTask(id, userId, updates);
        await loadAllData();
        toast.success('Task updated successfully');
      } else {
        toast.error('Google Sheets not available');
      }
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateTask(id, userId, updates);
        await loadAllData();
      } else {
        toast.error('Google Sheets not available');
      }
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateTask(id, userId, { isDeleted: true, deletedDate: new Date() });
        await loadAllData();
        toast.success('Task deleted');
      } else {
        toast.error('Google Sheets not available');
      }
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateTask(id, userId, { isDeleted: false, deletedDate: undefined });
        await loadAllData();
        toast.success('Task restored');
      } else {
        toast.error('Google Sheets not available');
      }
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateTask(taskId, userId, updates);
        await loadAllData();
        toast.success('Task moved successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to move task');
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    }
  };

  return {
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    rollOverTask,
  };
};
