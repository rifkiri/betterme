
import { supabase } from '@/integrations/supabase/client';

export class AuthEmailService {
  static async updateUserEmail(userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating email for user:', userId, 'to:', newEmail);
      
      // First, get the current user from auth to make sure they exist
      const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);
      
      if (getUserError || !authUser.user) {
        console.error('User not found in auth:', getUserError);
        return { success: false, error: 'User not found in authentication system' };
      }
      
      // Update email in Supabase Auth using the admin API
      const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        email: newEmail
      });
      
      if (updateError) {
        console.error('Error updating email in auth:', updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log('Successfully updated email in auth system');
      return { success: true };
    } catch (error) {
      console.error('Failed to update email:', error);
      return { success: false, error: 'Failed to update email in authentication system' };
    }
  }
}
