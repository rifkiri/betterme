
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
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4 sm:pb-6">
      <div className="space-y-1">
        <CardTitle className="text-lg sm:text-xl">User Management</CardTitle>
        <CardDescription className="text-sm">
          Manage user accounts, permissions, and organizational positions
          <span className="text-blue-600"> • Using Supabase</span>
        </CardDescription>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2 h-8 sm:h-9"
        >
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sm:hidden">Refresh</span>
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button 
          onClick={onAddUser}
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2 h-8 sm:h-9"
        >
          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </div>
    </CardHeader>
  );
};
