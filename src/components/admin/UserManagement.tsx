
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AddUserDialog } from './AddUserDialog';
import { UserManagementHeader } from './UserManagementHeader';
import { UserManagementContent } from './UserManagementContent';
import { UserPermissionGuard } from './UserPermissionGuard';
import { useUserManagement } from '@/hooks/useUserManagement';

export const UserManagement = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const {
    users,
    isLoading,
    currentUser,
    isAdmin,
    loadUsers,
    handleAddUser,
    handleDeleteUser,
    handleUpdateUser,
    handleActivateUser
  } = useUserManagement();

  return (
    <UserPermissionGuard currentUser={currentUser} isAdmin={isAdmin}>
      <Card>
        <UserManagementHeader
          onRefresh={loadUsers}
          onAddUser={() => setIsAddUserOpen(true)}
          isLoading={isLoading}
        />
        <UserManagementContent
          users={users}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
          onActivateUser={handleActivateUser}
        />
      </Card>

      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onAddUser={handleAddUser}
      />
    </UserPermissionGuard>
  );
};
