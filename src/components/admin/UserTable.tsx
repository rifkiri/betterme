
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, UserRole } from '@/types/userTypes';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface UserTableProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

const getRoleBadgeVariant = (role: UserRole) => {
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

export const UserTable = ({ users, onDeleteUser, onUpdateUser }: UserTableProps) => {
  const handleShowPassword = (user: User) => {
    if (user.temporaryPassword) {
      toast.info(`Temporary password: ${user.temporaryPassword}`);
    } else {
      toast.info('User has changed their password');
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role.replace('-', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.hasChangedPassword ? 'default' : 'outline'}>
                  {user.hasChangedPassword ? 'Active' : 'Pending'}
                </Badge>
              </TableCell>
              <TableCell>{user.createdAt}</TableCell>
              <TableCell>{user.lastLogin || 'Never'}</TableCell>
              <TableCell className="text-right space-x-2">
                {user.temporaryPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowPassword(user)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteUser(user.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
