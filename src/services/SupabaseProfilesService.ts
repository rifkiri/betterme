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
      console.error('Error fetching profiles'); // No sensitive data logged
      throw profilesError;
    }

    const users: User[] = [];

    if (profilesData) {
      profilesData.forEach(profile => {
        users.push({
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          role: profile.role || 'team-member',
          position: profile.position || '',
          temporaryPassword: profile.temporary_password || undefined,
          hasChangedPassword: profile.has_changed_password || false,
          userStatus: profile.user_status || 'active',
          createdAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          lastLogin: profile.last_login?.split('T')[0],
          managerId: (profile as any).manager_id || undefined
        });
      });
    }

    return users;
  }

  async addUser(user: User): Promise<void> {
    // Sanitize and validate input
    const sanitizedUser = {
      id: user.id,
      name: user.name?.trim().slice(0, 100) || '',
      email: user.email?.trim().toLowerCase().slice(0, 255) || '',
      role: user.role || 'team-member',
      position: user.position?.trim().slice(0, 100) || null,
      temporaryPassword: user.temporaryPassword || null,
      managerId: user.managerId || null
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedUser.email)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'team-member'];
    if (!validRoles.includes(sanitizedUser.role)) {
      throw new Error('Invalid role');
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: sanitizedUser.id,
        name: sanitizedUser.name,
        email: sanitizedUser.email,
        role: sanitizedUser.role,
        position: sanitizedUser.position,
        temporary_password: sanitizedUser.temporaryPassword,
        user_status: 'pending',
        has_changed_password: false,
        manager_id: sanitizedUser.managerId
      });

    if (error) {
      console.error('Error adding user'); // No sensitive data logged
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const supabaseUpdates: any = {};
    
    // Sanitize and validate updates
    if (updates.name !== undefined) {
      supabaseUpdates.name = updates.name.trim().slice(0, 100);
    }
    if (updates.email !== undefined) {
      const sanitizedEmail = updates.email.trim().toLowerCase().slice(0, 255);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }
      supabaseUpdates.email = sanitizedEmail;
    }
    if (updates.role !== undefined) {
      const validRoles = ['admin', 'manager', 'team-member'];
      if (!validRoles.includes(updates.role)) {
        throw new Error('Invalid role');
      }
      supabaseUpdates.role = updates.role;
    }
    if (updates.position !== undefined) {
      supabaseUpdates.position = updates.position?.trim().slice(0, 100) || null;
    }
    if (updates.temporaryPassword !== undefined) {
      supabaseUpdates.temporary_password = updates.temporaryPassword;
    }
    if (updates.hasChangedPassword !== undefined) {
      supabaseUpdates.has_changed_password = updates.hasChangedPassword;
    }
    if (updates.userStatus !== undefined) {
      const validStatuses = ['pending', 'active'];
      if (!validStatuses.includes(updates.userStatus)) {
        throw new Error('Invalid user status');
      }
      supabaseUpdates.user_status = updates.userStatus;
    }
    if (updates.lastLogin !== undefined) {
      supabaseUpdates.last_login = updates.lastLogin;
    }
    if (updates.managerId !== undefined) {
      supabaseUpdates.manager_id = updates.managerId;
    }

    const { error } = await supabase
      .from('profiles')
      .update(supabaseUpdates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user'); // No sensitive data logged
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user'); // No sensitive data logged
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by email'); // No sensitive data logged
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'team-member',
      position: data.position || '',
      temporaryPassword: data.temporary_password || undefined,
      hasChangedPassword: data.has_changed_password || false,
      userStatus: data.user_status || 'active',
      createdAt: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastLogin: data.last_login?.split('T')[0],
      managerId: (data as any).manager_id || undefined
    };
  }
}

export const supabaseProfilesService = new SupabaseProfilesService();
