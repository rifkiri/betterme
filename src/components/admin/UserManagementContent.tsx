
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserTable } from './UserTable';
import { User } from '@/types/userTypes';
import { Info } from 'lucide-react';

interface UserManagementContentProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

export const UserManagementContent = ({ users, onDeleteUser, onUpdateUser }: UserManagementContentProps) => {
  return (
    <CardContent className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Adding a user creates a profile entry. The user will need to register with their email and temporary password to complete account setup.
        </AlertDescription>
      </Alert>
      
      <UserTable
        users={users}
        onDeleteUser={onDeleteUser}
        onUpdateUser={onUpdateUser}
      />
    </CardContent>
  );
};
