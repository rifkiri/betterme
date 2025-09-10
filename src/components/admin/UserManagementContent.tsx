
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
  onActivateUser?: (userId: string) => void;
}

export const UserManagementContent = ({ users, onDeleteUser, onUpdateUser, onActivateUser }: UserManagementContentProps) => {
  return (
    <CardContent className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Adding a user creates a profile with 'pending' status. The user will need to sign in with their temporary password and change it to activate their account. Click the activate button (✓) to manually activate pending users.
        </AlertDescription>
      </Alert>
      
      <UserTable
        users={users}
        onDeleteUser={onDeleteUser}
        onUpdateUser={onUpdateUser}
        onActivateUser={onActivateUser}
      />
    </CardContent>
  );
};
