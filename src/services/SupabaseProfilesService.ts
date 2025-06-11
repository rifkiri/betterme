
import { User } from '@/types/userTypes';
import { AuthEmailService } from './AuthEmailService';
import { BaseProfilesService } from './profiles/BaseProfilesService';
import { ProfilesValidationService } from './profiles/ProfilesValidationService';
import { ProfilesDataTransformer } from './profiles/ProfilesDataTransformer';

export class SupabaseProfilesService {
  private baseService = new BaseProfilesService();

  async getUsers(): Promise<User[]> {
    const profilesData = await this.baseService.getAllProfiles();
    return ProfilesDataTransformer.transformProfilesToUsers(profilesData);
  }

  async addUser(user: User): Promise<void> {
    const sanitizedUser = ProfilesValidationService.sanitizeUser(user);

    // Validate required fields
    if (!sanitizedUser.name || !sanitizedUser.email || !sanitizedUser.temporaryPassword) {
      throw new Error('Name, email, and temporary password are required');
    }

    ProfilesValidationService.validateEmail(sanitizedUser.email);
    ProfilesValidationService.validateRole(sanitizedUser.role);

    await this.baseService.insertProfile({
      id: sanitizedUser.id,
      name: sanitizedUser.name,
      email: sanitizedUser.email,
      role: sanitizedUser.role,
      position: sanitizedUser.position,
      temporary_password: sanitizedUser.temporaryPassword,
      user_status: 'pending',
      has_changed_password: false,
      manager_id: sanitizedUser.managerId
    });
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const { supabaseUpdates, emailChanged, newEmail } = 
      ProfilesValidationService.sanitizeUserUpdates(updates);

    await this.baseService.updateProfile(userId, supabaseUpdates);

    // If email was changed, also update it in Supabase Auth
    if (emailChanged) {
      const { success, error: emailError } = await AuthEmailService.updateUserEmail(userId, newEmail);
      if (!success) {
        console.error('Failed to update email in auth system:', emailError);
        // Don't throw here as the profile was already updated successfully
        // The admin can manually sync this later if needed
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    await this.baseService.deleteProfile(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const data = await this.baseService.getProfileByEmail(email);
    
    if (!data) return null;

    return ProfilesDataTransformer.transformProfileToUser(data);
  }
}

export const supabaseProfilesService = new SupabaseProfilesService();
