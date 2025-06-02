
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface UserManagementHeaderProps {
  onRefresh: () => void;
  onAddUser: () => void;
  onDeleteAllNonAdmin: () => void;
  isLoading: boolean;
}

export const UserManagementHeader = ({ 
  onRefresh, 
  onAddUser, 
  onDeleteAllNonAdmin,
  isLoading 
}: UserManagementHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDeleteAllNonAdmin}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Non-Admin
          </Button>
          <Button size="sm" onClick={onAddUser} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
