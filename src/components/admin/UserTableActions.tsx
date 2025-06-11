
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/userTypes';
import { Trash2, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface UserTableActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const UserTableActions = ({ user, onEdit, onDelete }: UserTableActionsProps) => {
  const handleShowPassword = (user: User) => {
    if (user.userStatus === 'pending' && user.temporaryPassword) {
      toast.info(`Temporary password: ${user.temporaryPassword}`, {
        duration: 10000,
        description: 'Password will be cleared after first login'
      });
    } else if (user.userStatus === 'pending') {
      toast.info('No temporary password set for this user');
    } else {
      toast.info('User has changed their password from the default');
    }
  };

  return (
    <div className="text-right space-x-2">
      <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleShowPassword(user)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => onDelete(user.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
