
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/productivity';

export class SupabaseProjectsService {
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return data.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      progress: project.progress,
      dueDate: new Date(project.due_date),
      originalDueDate: project.original_due_date ? new Date(project.original_due_date) : undefined,
      isMoved: project.is_moved,
      isDeleted: project.is_deleted,
      completedDate: project.completed_date ? new Date(project.completed_date) : undefined,
      deletedDate: project.deleted_date ? new Date(project.deleted_date) : undefined,
      createdDate: new Date(project.created_date),
    }));
  }

  async addProject(project: Project & { userId: string }): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: project.userId,
        title: project.title,
        description: project.description,
        progress: project.progress,
        due_date: project.dueDate.toISOString().split('T')[0],
        original_due_date: project.originalDueDate?.toISOString().split('T')[0],
        is_moved: project.isMoved,
        is_deleted: project.isDeleted,
        completed_date: project.completedDate?.toISOString(),
        deleted_date: project.deletedDate?.toISOString(),
        created_date: project.createdDate.toISOString(),
      });

    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }

  async updateProject(id: string, userId: string, updates: Partial<Project>): Promise<void> {
    const supabaseUpdates: any = {};
    
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.progress !== undefined) supabaseUpdates.progress = updates.progress;
    if (updates.dueDate) supabaseUpdates.due_date = updates.dueDate.toISOString().split('T')[0];
    if (updates.originalDueDate) supabaseUpdates.original_due_date = updates.originalDueDate.toISOString().split('T')[0];
    if (updates.isMoved !== undefined) supabaseUpdates.is_moved = updates.isMoved;
    if (updates.isDeleted !== undefined) supabaseUpdates.is_deleted = updates.isDeleted;
    if (updates.completedDate) supabaseUpdates.completed_date = updates.completedDate.toISOString();
    if (updates.deletedDate) supabaseUpdates.deleted_date = updates.deletedDate.toISOString();

    const { error } = await supabase
      .from('projects')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async permanentlyDeleteProject(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error permanently deleting project:', error);
      throw error;
    }
  }
}

export const supabaseProjectsService = new SupabaseProjectsService();
