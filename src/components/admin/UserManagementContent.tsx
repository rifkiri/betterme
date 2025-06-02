
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
          Adding a user creates a profile with 'pending' status. The user will need to sign in with their temporary password and change it to activate their account.
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
