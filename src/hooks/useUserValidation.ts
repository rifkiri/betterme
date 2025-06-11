
import { User } from '@/types/userTypes';

export const useUserValidation = () => {
  const validateNewUser = (newUser: Omit<User, 'id' | 'createdAt'>) => {
    // Input validation and sanitization
    const sanitizedUser = {
      name: newUser.name?.trim().slice(0, 100) || '',
      email: newUser.email?.trim().toLowerCase().slice(0, 255) || '',
      role: newUser.role || 'team-member',
      position: newUser.position?.trim().slice(0, 100) || '',
      temporaryPassword: newUser.temporaryPassword || ''
    };

    // Validate required fields
    if (!sanitizedUser.name || !sanitizedUser.email || !sanitizedUser.temporaryPassword) {
      throw new Error('Name, email, and temporary password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedUser.email)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'team-member'];
    if (!validRoles.includes(sanitizedUser.role)) {
      throw new Error('Invalid role');
    }

    return sanitizedUser;
  };

  return {
    validateNewUser
  };
};
