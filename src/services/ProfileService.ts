
import { supabase } from '@/integrations/supabase/client';

export class ProfileService {
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return { profile: data, error };
  }

  static async createProfile(userId: string, userData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        position: userData.position,
        user_status: 'pending',
        has_changed_password: false,
        temporary_password: userData.temporary_password || userData.temporaryPassword
      });

    return { data, error };
  }

  static async updateProfileLogin(userId: string, hasLoggedIn: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        last_login: new Date().toISOString(),
        user_status: hasLoggedIn ? 'active' : 'pending'
      })
      .eq('id', userId);

    return { data, error };
  }

  static async updatePasswordStatus(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        has_changed_password: true,
        user_status: 'active'
      })
      .eq('id', userId);

    return { data, error };
  }
}
