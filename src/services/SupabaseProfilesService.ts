
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/userTypes';

export class SupabaseProfilesService {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data.map(profile => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      position: profile.position,
      hasChangedPassword: profile.has_changed_password,
      createdAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastLogin: profile.last_login?.split('T')[0],
      temporaryPassword: 'temp123' // Default for migration
    }));
  }

  async addUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        has_changed_password: user.hasChangedPassword,
        last_login: user.lastLogin
      });

    if (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const supabaseUpdates: any = {};
    
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.email) supabaseUpdates.email = updates.email;
    if (updates.role) supabaseUpdates.role = updates.role;
    if (updates.position) supabaseUpdates.position = updates.position;
    if (updates.hasChangedPassword !== undefined) supabaseUpdates.has_changed_password = updates.hasChangedPassword;
    if (updates.lastLogin) supabaseUpdates.last_login = updates.lastLogin;

    const { error } = await supabase
      .from('profiles')
      .update(supabaseUpdates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export const supabaseProfilesService = new SupabaseProfilesService();
