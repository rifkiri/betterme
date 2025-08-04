
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/types/userTypes';
import { EditUserDialog } from './EditUserDialog';
import { UserTableRow } from './UserTableRow';

interface UserTableProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

export const UserTable = ({
  users,
  onDeleteUser,
  onUpdateUser
}: UserTableProps) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditUser = (user: User) => {
    console.log('Opening edit dialog for user:', user);
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <UserTableRow
                key={user.id}
                user={user}
                onEditUser={handleEditUser}
                onDeleteUser={onDeleteUser}
                onUpdateUser={onUpdateUser}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={editingUser}
        onUpdateUser={onUpdateUser}
      />
    </>
  );
};
