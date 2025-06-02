
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';

interface UserManagementSectionProps {
  userRole?: string;
}

export const UserManagementSection = ({ userRole }: UserManagementSectionProps) => {
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserManagement />
      </CardContent>
    </Card>
  );
};
