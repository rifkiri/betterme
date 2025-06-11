
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/userTypes';
import { ProfilesDataTransformer } from './ProfilesDataTransformer';

export class BaseProfilesService {
  async getAllProfiles(): Promise<any[]> {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles');
      throw profilesError;
    }

    return profilesData || [];
  }

  async getProfileByEmail(email: string): Promise<any | null> {
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by email');
      return null;
    }

    return data;
  }

  async insertProfile(profileData: any): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert(profileData);

    if (error) {
      console.error('Error adding user');
      throw error;
    }
  }

  async updateProfile(userId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user');
      throw error;
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user');
      throw error;
    }
  }
}
