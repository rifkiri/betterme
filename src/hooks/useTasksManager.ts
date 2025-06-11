
import { supabaseDataService } from '@/services/SupabaseDataService';
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
  isGoogleSheetsAvailable: isSupabaseAvailable,
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
      id: crypto.randomUUID(),
      completed: false,
      createdDate: new Date(),
      dueDate: task.dueDate || new Date(),
      originalDueDate: task.dueDate || new Date(),
      isMoved: false,
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addTask({ ...newTask, userId });
        await loadAllData();
        toast.success('Task added successfully');
      } else {
        toast.error('Please sign in to add tasks');
      }
    } catch (error) {
      toast.error('Failed to add task');
      console.error('Failed to add task:', error);
    }
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateTask(id, userId, updates);
        await loadAllData();
        toast.success('Task updated successfully');
      } else {
        toast.error('Please sign in to edit tasks');
      }
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Failed to update task:', error);
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
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateTask(id, userId, updates);
        await loadAllData();
      } else {
        toast.error('Please sign in to update tasks');
      }
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateTask(id, userId, { isDeleted: true, deletedDate: new Date() });
        await loadAllData();
        toast.success('Task deleted');
      } else {
        toast.error('Please sign in to delete tasks');
      }
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Failed to delete task:', error);
    }
  };

  const restoreTask = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateTask(id, userId, { isDeleted: false, deletedDate: undefined });
        await loadAllData();
        toast.success('Task restored');
      } else {
        toast.error('Please sign in to restore tasks');
      }
    } catch (error) {
      toast.error('Failed to restore task');
      console.error('Failed to restore task:', error);
    }
  };

  const permanentlyDeleteTask = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        // Actually delete from database
        await supabaseDataService.updateTask(id, userId, { isDeleted: true });
        await loadAllData();
        toast.success('Task permanently deleted');
      } else {
        toast.error('Please sign in to delete tasks');
      }
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Failed to delete task:', error);
    }
  };

  const rollOverTask = async (taskId: string, newDueDate: Date) => {
    if (!userId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    console.log('Moving task:', task.title, 'to date:', newDueDate);

    // Ensure proper date comparison by setting to midnight
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const originalDate = task.originalDueDate || task.dueDate;
    const normalizedOriginal = normalizeDate(originalDate);
    const normalizedNew = normalizeDate(newDueDate);
    
    // Check if moving back to original date
    const isMovedBackToOriginal = normalizedOriginal.getTime() === normalizedNew.getTime();

    console.log('Original date:', originalDate);
    console.log('Is moved back to original:', isMovedBackToOriginal);

    const updates = {
      dueDate: newDueDate,
      originalDueDate: task.originalDueDate || task.dueDate,
      isMoved: !isMovedBackToOriginal
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateTask(taskId, userId, updates);
        await loadAllData();
        toast.success('Task moved successfully');
      } else {
        toast.error('Please sign in to move tasks');
      }
    } catch (error) {
      console.error('Failed to move task:', error);
      toast.error('Failed to move task');
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
