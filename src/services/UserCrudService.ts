
import { supabase } from '@/integrations/supabase/client';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { User } from '@/types/userTypes';

export class UserCrudService {
  static async createUser(userData: {
    name: string;
    email: string;
    role: string;
    position: string;
    temporaryPassword: string;
  }) {
    console.log('Creating user via Edge Function');
    
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: userData
    });

    if (error) {
      console.error('Edge function error');
      throw new Error('Failed to create user: ' + error.message);
    }

    if (!data.success) {
      console.error('User creation failed');
      throw new Error('Failed to create user: ' + data.error);
    }

    return data;
  }

  static async deleteUser(userId: string) {
    console.log('Deleting user via Edge Function:', userId);
    
    const { data, error } = await supabase.functions.invoke('delete-auth-users', {
      body: {
        userIds: [userId]
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error('Failed to delete user: ' + error.message);
    }

    if (!data.success) {
      console.error('User deletion failed:', data.error);
      throw new Error('Failed to delete user: ' + data.error);
    }

    // Check deletion results
    const results = data.results || [];
    const failedDeletions = results.filter(r => !r.success);
    
    if (failedDeletions.length > 0) {
      console.error('Some deletions failed:', failedDeletions);
      throw new Error('Failed to completely delete user from authentication system');
    }

    return data;
  }

  static async updateUserEmail(userId: string, newEmail: string) {
    console.log('Email update detected, syncing with auth system');
    const { data, error } = await supabase.functions.invoke('update-user-email', {
      body: {
        userId: userId,
        newEmail: newEmail
      }
    });

    if (error) {
      console.error('Failed to update email in auth system:', error);
      throw new Error('Failed to update email in authentication system');
    }

    if (!data.success) {
      console.error('Email update failed:', data.error);
      throw new Error('Failed to update email: ' + data.error);
    }

    console.log('Email updated successfully in auth system');
    return data;
  }

  static async updateUserPassword(userId: string, newPassword: string) {
    console.log('Password reset detected, updating auth system password');
    
    const { data, error } = await supabase.functions.invoke('update-user-password', {
      body: {
        userId: userId,
        newPassword: newPassword
      }
    });

    if (error) {
      console.error('Failed to update password in auth system:', error);
      throw new Error('Failed to update password in authentication system');
    }

    if (!data.success) {
      console.error('Password update failed:', data.error);
      throw new Error('Failed to update password: ' + data.error);
    }

    console.log('Password updated successfully in auth system');
    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>) {
    return await supabaseDataService.updateUser(userId, updates);
  }
}
