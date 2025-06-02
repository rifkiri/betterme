
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from './UserTable';
import { AddUserDialog } from './AddUserDialog';
import { User } from '@/types/userTypes';
import { UserPlus, RefreshCw } from 'lucide-react';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Google Sheets is available
  const isGoogleSheetsAvailable = () => {
    return googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated();
  };

  // Load users from Google Sheets
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      if (isGoogleSheetsAvailable()) {
        console.log('Loading users from Google Sheets...');
        const sheetsUsers = await googleSheetsService.getUsers();
        setUsers(sheetsUsers);
        console.log('Users loaded from Google Sheets successfully');
      } else {
        console.log('Google Sheets not available');
        toast.error('Google Sheets not configured. Please configure in Settings.');
      }
    } catch (error) {
      console.error('Failed to load users from Google Sheets:', error);
      toast.error('Failed to load users from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...newUser,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      hasChangedPassword: false
    };

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.addUser(user);
        await loadUsers();
        toast.success('User added successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to add user');
      setUsers([...users, user]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.deleteUser(userId);
        await loadUsers();
        toast.success('User deleted successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to delete user');
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateUser(userId, updates);
        await loadUsers();
        toast.success('User updated successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to update user');
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, permissions, and organizational positions
            <span className="text-blue-600"> • Using Google Sheets</span>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsAddUserOpen(true)}
            disabled={!isGoogleSheetsAvailable()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isGoogleSheetsAvailable() && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Google Sheets is not configured or authenticated. Please configure in Settings to manage users.
            </p>
          </div>
        )}
        <UserTable
          users={users}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
        />
      </CardContent>

      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onAddUser={handleAddUser}
      />
    </Card>
  );
};
