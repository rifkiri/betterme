
import { supabase } from '@/integrations/supabase/client';

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  temporary_password: string;
}

export class ProfileService {
  static async getProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { profile, error };
  }

  static async createProfile(userId: string, pendingUser: PendingUser) {
    console.log('Creating profile for pending user...');
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: pendingUser.name,
        email: pendingUser.email,
        role: pendingUser.role as 'admin' | 'manager' | 'team-member',
        position: pendingUser.position,
        has_changed_password: false
      });

    return { error };
  }

  static async updateProfileLogin(userId: string, isFirstTime: boolean = false) {
    const updateData: any = { last_login: new Date().toISOString() };
    
    if (isFirstTime) {
      updateData.has_changed_password = true;
    }

    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
  }
}
