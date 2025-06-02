
import { supabase } from '@/integrations/supabase/client';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
  temporaryPassword?: string;
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
      position: profile.position,
      temporaryPassword: (profile as any).temporary_password
    })) || [];

    return { data: pendingUsers, error: null };
  }

  static findMatchingPendingUser(pendingUsers: PendingUser[], password: string): PendingUser | null {
    // Find the pending user that matches the provided password
    return pendingUsers.find(user => user.temporaryPassword === password) || null;
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
