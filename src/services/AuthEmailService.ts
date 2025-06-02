
import { supabase } from '@/integrations/supabase/client';

export class AuthEmailService {
  static async updateUserEmail(userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('=== EMAIL UPDATE DEBUG START ===');
      console.log('Updating email for user:', userId, 'to:', newEmail);
      
      // Call the Edge Function to update email in auth system
      console.log('Calling update-user-email edge function...');
      const { data, error } = await supabase.functions.invoke('update-user-email', {
        body: {
          userId,
          newEmail
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        console.error('Failed to update email in auth system:', data?.error || 'Unknown error');
        return { success: false, error: data?.error || 'Failed to update email in authentication system' };
      }

      console.log('Successfully updated email in auth system');
      console.log('=== EMAIL UPDATE DEBUG END ===');
      return { success: true };
    } catch (error) {
      console.error('Failed to update email:', error);
      console.log('=== EMAIL UPDATE DEBUG END (ERROR) ===');
      return { success: false, error: 'Failed to update email in authentication system' };
    }
  }
}
