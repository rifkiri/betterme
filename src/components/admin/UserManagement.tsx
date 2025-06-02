
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from './UserTable';
import { AddUserDialog } from './AddUserDialog';
import { User } from '@/types/userTypes';
import { UserPlus, RefreshCw } from 'lucide-react';
import { localDataService } from '@/services/LocalDataService';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load users from local storage
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const localUsers = localDataService.getUsers();
      setUsers(localUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
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
      localDataService.addUser(user);
      await loadUsers();
      toast.success('User added successfully');
    } catch (error) {
      toast.error('Failed to add user');
      setUsers([...users, user]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      localDataService.deleteUser(userId);
      await loadUsers();
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      localDataService.updateUser(userId, updates);
      await loadUsers();
      toast.success('User updated successfully');
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
            <span className="text-green-600"> • Using Local Storage</span>
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
