
import { supabase } from '@/integrations/supabase/client';

export class AuthEmailService {
  static async updateUserEmail(userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating email for user:', userId, 'to:', newEmail);
      
      // Call the Edge Function to update email in auth system
      const { data, error } = await supabase.functions.invoke('update-user-email', {
        body: {
          userId,
          newEmail
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('Failed to update email in auth system:', data.error);
        return { success: false, error: data.error };
      }

      console.log('Successfully updated email in auth system');
      return { success: true };
    } catch (error) {
      console.error('Failed to update email:', error);
      return { success: false, error: 'Failed to update email in authentication system' };
    }
  }
}
