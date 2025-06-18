
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/projects';

export class SupabaseProjectsService {
  async getProjects(userId: string): Promise<Project[]> {
    console.log('Fetching projects for user:', userId);
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return data?.map(this.transformFromDatabase) || [];
  }

  async addProject(project: Omit<Project, 'id'>): Promise<Project> {
    console.log('Adding project:', project);
    
    const projectData = this.transformToDatabase(project);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }

    return this.transformFromDatabase(data);
  }

  async updateProject(id: string, userId: string, updates: Partial<Project>): Promise<void> {
    console.log('Updating project:', id, updates);
    
    const updateData = this.transformToDatabase(updates);
    
    const { error } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async permanentlyDeleteProject(id: string, userId: string): Promise<void> {
    console.log('Permanently deleting project:', id);
    
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

  private transformFromDatabase(data: any): Project {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      progress: data.progress,
      createdDate: new Date(data.created_date),
      dueDate: data.due_date ? new Date(data.due_date) : new Date(),
      originalDueDate: data.original_due_date ? new Date(data.original_due_date) : undefined,
      completedDate: data.completed_date ? new Date(data.completed_date) : undefined,
      isMoved: data.is_moved,
      isDeleted: data.is_deleted,
      deletedDate: data.deleted_date ? new Date(data.deleted_date) : undefined
    };
  }

  private transformToDatabase(project: Partial<Project>): any {
    const data: any = {};
    
    if (project.userId !== undefined) data.user_id = project.userId;
    if (project.title !== undefined) data.title = project.title;
    if (project.description !== undefined) data.description = project.description;
    if (project.progress !== undefined) data.progress = project.progress;
    if (project.createdDate !== undefined) data.created_date = project.createdDate.toISOString();
    if (project.dueDate !== undefined) data.due_date = project.dueDate.toISOString();
    if (project.originalDueDate !== undefined) data.original_due_date = project.originalDueDate.toISOString();
    if (project.completedDate !== undefined) data.completed_date = project.completedDate.toISOString();
    if (project.isMoved !== undefined) data.is_moved = project.isMoved;
    if (project.isDeleted !== undefined) data.is_deleted = project.isDeleted;
    if (project.deletedDate !== undefined) data.deleted_date = project.deletedDate.toISOString();
    
    return data;
  }
}

export const supabaseProjectsService = new SupabaseProjectsService();
