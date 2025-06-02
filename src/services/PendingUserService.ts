
import { supabase } from '@/integrations/supabase/client';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
}

export class PendingUserService {
  static async getPendingUsers(email: string): Promise<{ data: PendingUser[] | null, error: any }> {
    console.log('Checking for pending user with email:', email);
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('user_status', 'pending');

    if (error) {
      return { data: null, error };
    }

    const pendingUsers: PendingUser[] = profiles?.map(profile => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      position: profile.position
    })) || [];

    return { data: pendingUsers, error: null };
  }

  static findMatchingPendingUser(pendingUsers: PendingUser[], password: string): PendingUser | null {
    // Since we removed temporary passwords for security, we'll need to handle pending users differently
    // For now, return the first pending user if one exists (this will need to be updated based on your business logic)
    return pendingUsers.length > 0 ? pendingUsers[0] : null;
  }

  static async removePendingUser(pendingUserId: string) {
    console.log('Removing pending user data...');
    
    const { error } = await supabase
      .from('profiles')
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
