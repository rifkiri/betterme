
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, RefreshCw } from 'lucide-react';

interface UserManagementHeaderProps {
  onRefresh: () => void;
  onAddUser: () => void;
  isLoading: boolean;
}

export const UserManagementHeader = ({ onRefresh, onAddUser, isLoading }: UserManagementHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts, permissions, and organizational positions
          <span className="text-blue-600"> • Using Supabase</span>
        </CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={onAddUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
    </CardHeader>
  );
};
