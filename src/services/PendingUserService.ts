
import { supabase } from '@/integrations/supabase/client';
import { PendingUser } from './ProfileService';

export class PendingUserService {
  static async getPendingUsers(email: string): Promise<{ data: PendingUser[] | null, error: any }> {
    console.log('Checking for pending user with email:', email);
    
    const { data: pendingUsers, error } = await supabase
      .from('pending_users')
      .select('*')
      .eq('email', email);

    return { data: pendingUsers, error };
  }

  static async findMatchingPendingUser(pendingUsers: PendingUser[], password: string): Promise<PendingUser | null> {
    return pendingUsers.find(user => user.temporary_password === password) || null;
  }

  static async removePendingUser(pendingUserId: string) {
    console.log('Removing pending user data...');
    
    const { error } = await supabase
      .from('pending_users')
      .delete()
      .eq('id', pendingUserId);

    if (error) {
      console.warn('Could not remove pending user:', error);
    } else {
      console.log('Successfully removed pending user data');
    }

    return { error };
  }
}
