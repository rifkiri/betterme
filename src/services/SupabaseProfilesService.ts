
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/userTypes';

export class SupabaseProfilesService {
  async getUsers(): Promise<User[]> {
    // Get all profiles (both active and pending users)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const users: User[] = [];

    if (profilesData) {
      profilesData.forEach(profile => {
        users.push({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          position: profile.position,
          hasChangedPassword: profile.has_changed_password,
          userStatus: profile.user_status || 'active',
          createdAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          lastLogin: profile.last_login?.split('T')[0],
          temporaryPassword: profile.temporary_password,
          managerId: profile.manager_id || undefined // Safely map manager_id from database
        });
      });
    }

    return users;
  }

  async addUser(user: User): Promise<void> {
    // Create a pending user profile that can be used for sign up
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        temporary_password: user.temporaryPassword || 'temp123',
        user_status: 'pending',
        has_changed_password: false,
        manager_id: user.managerId || null // Map managerId to manager_id
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
    if (updates.position !== undefined) supabaseUpdates.position = updates.position;
    if (updates.hasChangedPassword !== undefined) supabaseUpdates.has_changed_password = updates.hasChangedPassword;
    if (updates.userStatus) supabaseUpdates.user_status = updates.userStatus;
    if (updates.temporaryPassword) supabaseUpdates.temporary_password = updates.temporaryPassword;
    if (updates.lastLogin) supabaseUpdates.last_login = updates.lastLogin;
    if (updates.managerId !== undefined) supabaseUpdates.manager_id = updates.managerId; // Map managerId to manager_id

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

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      position: data.position,
      hasChangedPassword: data.has_changed_password,
      userStatus: data.user_status || 'active',
      createdAt: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastLogin: data.last_login?.split('T')[0],
      temporaryPassword: data.temporary_password,
      managerId: data.manager_id || undefined // Safely map manager_id from database
    };
  }
}

export const supabaseProfilesService = new SupabaseProfilesService();
