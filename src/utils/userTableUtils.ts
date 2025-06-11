
import { UserRole } from '@/types/userTypes';

export const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'manager':
      return 'default';
    case 'team-member':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'outline';
    default:
      return 'secondary';
  }
};
