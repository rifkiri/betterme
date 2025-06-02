
import React from 'react';
import { Users } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';

interface UserManagementSectionProps {
  userRole?: string;
}

export const UserManagementSection = ({ userRole }: UserManagementSectionProps) => {
  if (userRole !== 'admin') {
    return null;
  }

  return <UserManagement />;
};
