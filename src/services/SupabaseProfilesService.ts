
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
      temporaryPassword: profile.has_changed_password ? undefined : 'temp123' // Show temp password if not changed
    }));
  }

  async addUser(user: User): Promise<void> {
    // Generate a temporary password for new users
    const tempPassword = user.temporaryPassword || 'temp123';
    
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: user.name
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    // Then create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        has_changed_password: false, // New users haven't changed their password yet
        last_login: user.lastLogin
      });

    if (profileError) {
      console.error('Error adding user profile:', profileError);
      // Try to clean up auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
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

    // If email is being updated, also update it in auth
    if (updates.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: updates.email
      });
      
      if (authError) {
        console.error('Error updating auth email:', authError);
        // Don't throw here as the profile was already updated
      }
    }

    // If password is being reset
    if (updates.temporaryPassword) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
        password: updates.temporaryPassword
      });
      
      if (passwordError) {
        console.error('Error updating password:', passwordError);
        // Don't throw here as the profile was already updated
      } else {
        // Mark that user needs to change password
        await supabase
          .from('profiles')
          .update({ has_changed_password: false })
          .eq('id', userId);
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete the profile first
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      throw profileError;
    }

    // Then delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Don't throw here as the profile was already deleted
    }
  }
}

export const supabaseProfilesService = new SupabaseProfilesService();
