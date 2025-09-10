
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserRole } from '@/types/userTypes';
import { UserTableActions } from './UserTableActions';
import { getRoleBadgeVariant, getStatusBadgeVariant } from '@/utils/userTableUtils';
import { toast } from 'sonner';

interface UserTableRowProps {
  user: User;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onActivateUser?: (userId: string) => void;
}

export const UserTableRow = ({ user, onEditUser, onDeleteUser, onUpdateUser, onActivateUser }: UserTableRowProps) => {
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    onUpdateUser(userId, {
      role: newRole
    });
    toast.success('User role updated successfully');
  };

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Select value={user.role} onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team-member">Team Member</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>{user.position || '-'}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(user.userStatus)}>
          {user.userStatus}
        </Badge>
      </TableCell>
      <TableCell>{user.createdAt}</TableCell>
      <TableCell>{user.lastLogin || 'Never'}</TableCell>
      <TableCell>
        <UserTableActions
          user={user}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
          onActivateUser={onActivateUser}
        />
      </TableCell>
    </TableRow>
  );
};
