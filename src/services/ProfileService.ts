
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
    // Sanitize input data
    const sanitizedData = {
      name: userData.name?.trim().slice(0, 100) || '',
      email: userData.email?.trim().toLowerCase().slice(0, 255) || '',
      role: userData.role || 'team-member',
      position: userData.position?.trim().slice(0, 100) || null,
      temporaryPassword: userData.temporaryPassword || null,
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return { data: null, error: { message: 'Invalid email format' } };
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: sanitizedData.name,
        email: sanitizedData.email,
        role: sanitizedData.role,
        position: sanitizedData.position,
        temporary_password: sanitizedData.temporaryPassword,
        user_status: 'pending',
        has_changed_password: false
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
        user_status: 'active',
        temporary_password: null // Clear temporary password after first login
      })
      .eq('id', userId);

    return { data, error };
  }
}
