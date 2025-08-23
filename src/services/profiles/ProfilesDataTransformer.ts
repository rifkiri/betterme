
import { User } from '@/types/userTypes';
import { formatDateForDatabase } from '@/lib/utils';

export class ProfilesDataTransformer {
  static transformProfileToUser(profile: any): User {
    return {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      role: profile.role || 'team-member',
      position: profile.position || '',
      temporaryPassword: profile.temporary_password || undefined,
      hasChangedPassword: profile.has_changed_password || false,
      userStatus: profile.user_status || 'active',
      createdAt: profile.created_at?.split('T')[0] || formatDateForDatabase(new Date()),
      lastLogin: profile.last_login?.split('T')[0],
      managerId: (profile as any).manager_id || undefined
    };
  }

  static transformProfilesToUsers(profilesData: any[]): User[] {
    const users: User[] = [];
    
    if (profilesData) {
      profilesData.forEach(profile => {
        users.push(this.transformProfileToUser(profile));
      });
    }

    return users;
  }
}
