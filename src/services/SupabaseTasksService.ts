
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/productivity';

export class SupabaseTasksService {
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return data.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: this.mapDatabasePriorityToApp(task.priority),
      dueDate: new Date(task.due_date),
      originalDueDate: task.original_due_date ? new Date(task.original_due_date) : undefined,
      isMoved: task.is_moved,
      isDeleted: task.is_deleted,
      completedDate: task.completed_date ? new Date(task.completed_date) : undefined,
      deletedDate: task.deleted_date ? new Date(task.deleted_date) : undefined,
      createdDate: new Date(task.created_date)
    }));
  }

  private mapDatabasePriorityToApp(dbPriority: string | null): 'Low' | 'Medium' | 'High' {
    switch (dbPriority) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': 
      case 'urgent': return 'High';
      default: return 'Medium';
    }
  }

  private mapAppPriorityToDatabase(appPriority: 'Low' | 'Medium' | 'High'): 'low' | 'medium' | 'high' {
    switch (appPriority) {
      case 'Low': return 'low';
      case 'Medium': return 'medium';
      case 'High': return 'high';
      default: return 'medium';
    }
  }

  async addTask(task: Task & { userId: string }): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: task.userId,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: this.mapAppPriorityToDatabase(task.priority),
        due_date: task.dueDate.toISOString().split('T')[0],
        original_due_date: task.originalDueDate?.toISOString().split('T')[0],
        is_moved: task.isMoved,
        is_deleted: task.isDeleted,
        completed_date: task.completedDate?.toISOString(),
        deleted_date: task.deletedDate?.toISOString(),
        created_date: task.createdDate.toISOString()
      });

    if (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>): Promise<void> {
    const supabaseUpdates: any = {};
    
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
    if (updates.priority) supabaseUpdates.priority = this.mapAppPriorityToDatabase(updates.priority);
    if (updates.dueDate) supabaseUpdates.due_date = updates.dueDate.toISOString().split('T')[0];
    if (updates.originalDueDate) supabaseUpdates.original_due_date = updates.originalDueDate.toISOString().split('T')[0];
    if (updates.isMoved !== undefined) supabaseUpdates.is_moved = updates.isMoved;
    if (updates.isDeleted !== undefined) supabaseUpdates.is_deleted = updates.isDeleted;
    if (updates.completedDate) supabaseUpdates.completed_date = updates.completedDate.toISOString();
    if (updates.deletedDate) supabaseUpdates.deleted_date = updates.deletedDate.toISOString();

    const { error } = await supabase
      .from('tasks')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }
}

export const supabaseTasksService = new SupabaseTasksService();
