
export type UserRole = 'admin' | 'manager' | 'team-member';
export type UserStatus = 'pending' | 'active';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string;
  temporaryPassword?: string;
  hasChangedPassword: boolean;
  userStatus: UserStatus;
  createdAt: string;
  lastLogin?: string;
  managerId?: string; // Added managerId field
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}
