
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
  const [useGoogleSheets, setUseGoogleSheets] = useState(googleSheetsService.isConfigured());

  // Load users from Google Sheets if configured
  const loadUsers = async () => {
    if (!googleSheetsService.isConfigured()) {
      return;
    }

    setIsLoading(true);
    try {
      const sheetsUsers = await googleSheetsService.getUsers();
      if (sheetsUsers.length >= 0) { // Changed from > 0 to >= 0 to handle empty sheets
        setUsers(sheetsUsers);
        setUseGoogleSheets(true);
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
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (useGoogleSheets && googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.addUser(user);
        await loadUsers(); // Reload from sheets
        toast.success('User added to Google Sheets successfully');
      } catch (error) {
        toast.error('Failed to add user to Google Sheets');
        // Fallback to local state
        setUsers([...users, user]);
      }
    } else {
      setUsers([...users, user]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (useGoogleSheets && googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.deleteUser(userId);
        await loadUsers(); // Reload from sheets
        toast.success('User deleted from Google Sheets successfully');
      } catch (error) {
        toast.error('Failed to delete user from Google Sheets');
        // Fallback to local state
        setUsers(users.filter(user => user.id !== userId));
      }
    } else {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    if (useGoogleSheets && googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.updateUser(userId, updates);
        await loadUsers(); // Reload from sheets
        toast.success('User updated in Google Sheets successfully');
      } catch (error) {
        toast.error('Failed to update user in Google Sheets');
        // Fallback to local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ));
      }
    } else {
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
            {useGoogleSheets && (
              <span className="text-green-600"> • Connected to Google Sheets</span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {useGoogleSheets && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
