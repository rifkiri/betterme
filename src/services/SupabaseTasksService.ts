
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/productivity';
import { formatDateForDatabase, parseLocalDate } from '@/lib/utils';

export class SupabaseTasksService {
  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  }

  private async syncTaskInvitations(
    taskId: string,
    selectedSupporterIds: string[] | undefined,
    acceptedSupporterIds: string[] = []
  ): Promise<string[]> {
    const currentUserId = await this.getCurrentUserId();
    const requestedIds = Array.from(new Set((selectedSupporterIds || []).filter(Boolean)));
    const acceptedIds = Array.from(new Set((acceptedSupporterIds || []).filter(Boolean)));
    const acceptedToKeep = acceptedIds.filter((id) => requestedIds.includes(id));
    const { data: existingInvitations, error: existingInvitationsError } = await (supabase as any)
      .from('task_invitations')
      .select('invitee_id, status')
      .eq('task_id', taskId);

    if (existingInvitationsError) {
      console.error('Error loading existing task invitations:', existingInvitationsError);
      throw existingInvitationsError;
    }

    const activeInvitationIds = (existingInvitations || [])
      .filter((row: any) => row.status === 'pending' || row.status === 'accepted')
      .map((row: any) => row.invitee_id);
    const existingInvitationIds = (existingInvitations || []).map((row: any) => row.invitee_id);
    const idsToInvite = requestedIds.filter((id) => !acceptedIds.includes(id) && !activeInvitationIds.includes(id));

    if (idsToInvite.length > 0 && currentUserId) {
      const { error } = await (supabase as any)
        .from('task_invitations')
        .upsert(
          idsToInvite.map((inviteeId) => ({
            task_id: taskId,
            invitee_id: inviteeId,
            invited_by: currentUserId,
            status: 'pending',
            responded_at: null,
          })),
          { onConflict: 'task_id,invitee_id' }
        );

      if (error) {
        console.error('Error creating task invitations:', error);
        throw error;
      }
    }

    const idsNoLongerSelected = Array.from(new Set([...acceptedIds, ...existingInvitationIds]))
      .filter((id) => !requestedIds.includes(id));
    if (idsNoLongerSelected.length > 0) {
      const { error } = await (supabase as any)
        .from('task_invitations')
        .delete()
        .eq('task_id', taskId)
        .in('invitee_id', idsNoLongerSelected);

      if (error) {
        console.error('Error removing task invitations:', error);
        throw error;
      }
    }

    return acceptedToKeep;
  }

  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${userId},tagged_users.cs.{${userId}}`)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    const taskIds = (data || []).map((task) => task.id);
    let pendingInvitationsByTask: Record<string, string[]> = {};

    if (taskIds.length > 0) {
      // Batch task IDs to avoid exceeding PostgREST URL length limits (Bad Request)
      // when a user owns many tasks (e.g. admin/manager on org dashboard).
      const CHUNK_SIZE = 100;
      for (let i = 0; i < taskIds.length; i += CHUNK_SIZE) {
        const chunk = taskIds.slice(i, i + CHUNK_SIZE);
        const { data: pendingInvitations, error: invitationsError } = await (supabase as any)
          .from('task_invitations')
          .select('task_id, invitee_id')
          .in('task_id', chunk)
          .eq('status', 'pending');

        if (invitationsError) {
          // Non-fatal: pending-invitation data is enrichment, not core task data.
          console.warn('Error fetching pending task invitations chunk (continuing without them):', invitationsError);
          continue;
        }

        for (const row of pendingInvitations || []) {
          pendingInvitationsByTask[row.task_id] = [
            ...(pendingInvitationsByTask[row.task_id] || []),
            row.invitee_id,
          ];
        }
      }
    }

    return data.map(task => ({
      id: task.id,
      userId: task.user_id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: this.mapDatabasePriorityToApp(task.priority),
      dueDate: parseLocalDate(task.due_date),
      originalDueDate: task.original_due_date ? parseLocalDate(task.original_due_date) : undefined,
      isMoved: task.is_moved,
      isDeleted: task.is_deleted,
      completedDate: task.completed_date ? new Date(task.completed_date) : undefined,
      deletedDate: task.deleted_date ? new Date(task.deleted_date) : undefined,
      createdDate: new Date(task.created_date),
      weeklyOutputId: task.weekly_output_id,
      taggedUsers: (task as any).tagged_users || [],
      pendingTaggedUsers: pendingInvitationsByTask[task.id] || [],
      visibility: (task as any).visibility || 'all'
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
    const acceptedSupporters: string[] = [];
    const pendingSupporters = task.taggedUsers || [];

    const { error } = await supabase
      .from('tasks')
      .insert({
        id: task.id,
        user_id: task.userId,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: this.mapAppPriorityToDatabase(task.priority),
        due_date: formatDateForDatabase(task.dueDate),
        original_due_date: task.originalDueDate ? formatDateForDatabase(task.originalDueDate) : null,
        is_moved: task.isMoved,
        is_deleted: task.isDeleted,
        completed_date: task.completedDate?.toISOString(),
        deleted_date: task.deletedDate?.toISOString(),
        created_date: task.createdDate.toISOString(),
        weekly_output_id: task.weeklyOutputId || null,
        tagged_users: acceptedSupporters,
        visibility: task.visibility || 'all'
      });

    if (error) {
      console.error('Error adding task:', error);
      throw error;
    }

    await this.syncTaskInvitations(task.id, pendingSupporters, acceptedSupporters);
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>): Promise<void> {
    console.log('SupabaseTasksService - Updating task:', id, 'for user:', userId, 'with updates:', updates);
    
    const supabaseUpdates: any = {};
    let acceptedSupporters: string[] | undefined;
    
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
    if (updates.priority) supabaseUpdates.priority = this.mapAppPriorityToDatabase(updates.priority);
    if (updates.dueDate) supabaseUpdates.due_date = formatDateForDatabase(updates.dueDate);
    if (updates.originalDueDate) supabaseUpdates.original_due_date = formatDateForDatabase(updates.originalDueDate);
    if (updates.isMoved !== undefined) supabaseUpdates.is_moved = updates.isMoved;
    if (updates.isDeleted !== undefined) supabaseUpdates.is_deleted = updates.isDeleted;
    if (updates.completedDate) supabaseUpdates.completed_date = updates.completedDate.toISOString();
    if (updates.deletedDate) supabaseUpdates.deleted_date = updates.deletedDate.toISOString();
    if (updates.weeklyOutputId !== undefined) {
      supabaseUpdates.weekly_output_id = (updates.weeklyOutputId === "none" || !updates.weeklyOutputId) ? null : updates.weeklyOutputId;
      console.log('SupabaseTasksService - weeklyOutputId update:', updates.weeklyOutputId, '→', supabaseUpdates.weekly_output_id);
      
      // If unlinking (setting to null), no need to manage linkages anymore
      if (updates.weeklyOutputId === "none" || !updates.weeklyOutputId) {
        console.log('🗑️ Unlinking task from output:', id);
      }
    }
    if (updates.taggedUsers !== undefined) {
      const { data: currentTask, error: currentTaskError } = await supabase
        .from('tasks')
        .select('tagged_users')
        .eq('id', id)
        .maybeSingle();

      if (currentTaskError) {
        console.error('SupabaseTasksService - Error loading current task supporters:', currentTaskError);
        throw currentTaskError;
      }

      acceptedSupporters = await this.syncTaskInvitations(
        id,
        updates.taggedUsers,
        (currentTask as any)?.tagged_users || []
      );
      supabaseUpdates.tagged_users = acceptedSupporters;
    }
    if (updates.visibility !== undefined) supabaseUpdates.visibility = updates.visibility || 'all';

    console.log('SupabaseTasksService - Final supabase updates object:', supabaseUpdates);

    const { error } = await supabase
      .from('tasks')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('SupabaseTasksService - Error updating task:', error);
      throw error;
    }
    
    console.log('SupabaseTasksService - Task updated successfully');
  }

  async permanentlyDeleteTask(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error permanently deleting task:', error);
      throw error;
    }
  }
}

export const supabaseTasksService = new SupabaseTasksService();
