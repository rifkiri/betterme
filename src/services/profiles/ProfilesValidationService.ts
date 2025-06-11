
import { User } from '@/types/userTypes';

export class ProfilesValidationService {
  static sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name?.trim().slice(0, 100) || '',
      email: user.email?.trim().toLowerCase().slice(0, 255) || '',
      role: user.role || 'team-member',
      position: user.position?.trim().slice(0, 100) || null,
      temporaryPassword: user.temporaryPassword || null,
      managerId: user.managerId || null
    };
  }

  static sanitizeUserUpdates(updates: Partial<User>) {
    const supabaseUpdates: any = {};
    let emailChanged = false;
    let newEmail = '';

    if (updates.name !== undefined) {
      supabaseUpdates.name = updates.name.trim().slice(0, 100);
    }
    if (updates.email !== undefined) {
      const sanitizedEmail = updates.email.trim().toLowerCase().slice(0, 255);
      this.validateEmail(sanitizedEmail);
      supabaseUpdates.email = sanitizedEmail;
      emailChanged = true;
      newEmail = sanitizedEmail;
    }
    if (updates.role !== undefined) {
      this.validateRole(updates.role);
      supabaseUpdates.role = updates.role;
    }
    if (updates.position !== undefined) {
      supabaseUpdates.position = updates.position?.trim().slice(0, 100) || null;
    }
    if (updates.temporaryPassword !== undefined) {
      supabaseUpdates.temporary_password = updates.temporaryPassword;
    }
    if (updates.hasChangedPassword !== undefined) {
      supabaseUpdates.has_changed_password = updates.hasChangedPassword;
    }
    if (updates.userStatus !== undefined) {
      this.validateUserStatus(updates.userStatus);
      supabaseUpdates.user_status = updates.userStatus;
    }
    if (updates.lastLogin !== undefined) {
      supabaseUpdates.last_login = updates.lastLogin;
    }
    if (updates.managerId !== undefined) {
      supabaseUpdates.manager_id = updates.managerId;
    }

    return { supabaseUpdates, emailChanged, newEmail };
  }

  static validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  static validateRole(role: string) {
    const validRoles = ['admin', 'manager', 'team-member'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
  }

  static validateUserStatus(userStatus: string) {
    const validStatuses = ['pending', 'active'];
    if (!validStatuses.includes(userStatus)) {
      throw new Error('Invalid user status');
    }
  }
}
