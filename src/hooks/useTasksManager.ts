import { supabaseDataService } from '@/services/SupabaseDataService';
import { Task } from '@/types/productivity';
import { toast } from 'sonner';

interface UseTasksManagerProps {
  userId: string | null;
  loadAllData: () => Promise<void>;
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  deletedTasks: Task[];
  setDeletedTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

export const useTasksManager = ({
  userId,
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
      await supabaseDataService.addTask({ ...newTask, userId });
      await loadAllData();
      toast.success('Task added successfully');
    } catch (error) {
      toast.error('Failed to add task');
      console.error('Failed to add task:', error);
    }
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;

    try {
      await supabaseDataService.updateTask(id, userId, updates);
      await loadAllData();
      toast.success('Task updated successfully');
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
      await supabaseDataService.updateTask(id, userId, updates);
      await loadAllData();
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;

    try {
      await supabaseDataService.updateTask(id, userId, { isDeleted: true, deletedDate: new Date() });
      await loadAllData();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Failed to delete task:', error);
    }
  };

  const restoreTask = async (id: string) => {
    if (!userId) return;

    try {
      await supabaseDataService.updateTask(id, userId, { isDeleted: false, deletedDate: undefined });
      await loadAllData();
      toast.success('Task restored');
    } catch (error) {
      toast.error('Failed to restore task');
      console.error('Failed to restore task:', error);
    }
  };

  const permanentlyDeleteTask = async (id: string) => {
    if (!userId) return;

    try {
      // Actually delete the task permanently from the database
      await supabaseDataService.permanentlyDeleteTask(id, userId);
      await loadAllData();
      toast.success('Task permanently deleted');
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

    // Ensure proper date comparison by setting all dates to midnight UTC
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    // Store original due date if this is the first move
    const originalDate = task.originalDueDate || task.dueDate;
    const normalizedOriginal = normalizeDate(originalDate);
    const normalizedNew = normalizeDate(newDueDate);
    
    // Check if moving back to original date
    const isMovedBackToOriginal = normalizedOriginal.getTime() === normalizedNew.getTime();

    console.log('Original date:', originalDate);
    console.log('Is moved back to original:', isMovedBackToOriginal);

    const updates: Partial<Task> = {
      dueDate: newDueDate,
      // Only set originalDueDate if it's not already set
      originalDueDate: task.originalDueDate || task.dueDate,
      // Only set isMoved to false if moving back to original date
      isMoved: !isMovedBackToOriginal
    };

    try {
      await supabaseDataService.updateTask(taskId, userId, updates);
      await loadAllData();
      toast.success('Task moved successfully');
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