
export type UserRole = 'admin' | 'manager' | 'team-member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string;
  temporaryPassword?: string;
  hasChangedPassword: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}
