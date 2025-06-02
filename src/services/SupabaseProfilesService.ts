
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/userTypes';

export class SupabaseProfilesService {
  async getUsers(): Promise<User[]> {
    // Get existing profiles (actual users)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Get pending users - direct query to pending_users table
    const { data: pendingData, error: pendingError } = await (supabase as any)
      .from('pending_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('Error fetching pending users:', pendingError);
    }

    const users: User[] = [];

    // Add existing profiles
    if (profilesData) {
      users.push(...profilesData.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        position: profile.position,
        hasChangedPassword: profile.has_changed_password,
        createdAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        lastLogin: profile.last_login?.split('T')[0],
        temporaryPassword: undefined // Don't show temp password for existing users
      })));
    }

    // Add pending users
    if (pendingData) {
      users.push(...pendingData.map((pending: any) => ({
        id: pending.id,
        name: pending.name,
        email: pending.email,
        role: pending.role,
        position: pending.position,
        hasChangedPassword: false,
        createdAt: pending.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        lastLogin: undefined,
        temporaryPassword: pending.temporary_password
      })));
    }

    return users;
  }

  async addUser(user: User): Promise<void> {
    // Create a pending user entry that will be converted to a profile when they register
    const { error } = await (supabase as any)
      .from('pending_users')
      .insert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        temporary_password: user.temporaryPassword || 'temp123'
      });

    if (error) {
      console.error('Error adding pending user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    // Try to update in profiles first
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.role && { role: updates.role }),
        ...(updates.position !== undefined && { position: updates.position }),
        ...(updates.hasChangedPassword !== undefined && { has_changed_password: updates.hasChangedPassword }),
        ...(updates.lastLogin && { last_login: updates.lastLogin })
      })
      .eq('id', userId);

    // If not found in profiles, try pending_users
    if (profileError) {
      const { error: pendingError } = await (supabase as any)
        .from('pending_users')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.email && { email: updates.email }),
          ...(updates.role && { role: updates.role }),
          ...(updates.position !== undefined && { position: updates.position }),
          ...(updates.temporaryPassword && { temporary_password: updates.temporaryPassword })
        })
        .eq('id', userId);

      if (pendingError) {
        console.error('Error updating user:', pendingError);
        throw pendingError;
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Try to delete from profiles first
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // If not found in profiles, try pending_users
    if (profileError) {
      const { error: pendingError } = await (supabase as any)
        .from('pending_users')
        .delete()
        .eq('id', userId);

      if (pendingError) {
        console.error('Error deleting user:', pendingError);
        throw pendingError;
      }
    }
  }
}

export const supabaseProfilesService = new SupabaseProfilesService();
