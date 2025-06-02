
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from './UserTable';
import { AddUserDialog } from './AddUserDialog';
import { User } from '@/types/userTypes';
import { UserPlus, RefreshCw } from 'lucide-react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    return supabaseDataService.isConfigured();
  };

  // Load users from Supabase
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseAvailable()) {
        console.log('Loading users from Supabase...');
        const supabaseUsers = await supabaseDataService.getUsers();
        setUsers(supabaseUsers);
        console.log('Users loaded from Supabase successfully');
      } else {
        console.log('Supabase not available');
        toast.error('Supabase not configured. Please check your configuration.');
      }
    } catch (error) {
      console.error('Failed to load users from Supabase:', error);
      toast.error('Failed to load users from Supabase');
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
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
      hasChangedPassword: false
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addUser(user);
        await loadUsers();
        toast.success('User added successfully');
      } else {
        toast.error('Supabase not available');
      }
    } catch (error) {
      toast.error('Failed to add user');
      console.error('Failed to add user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.deleteUser(userId);
        await loadUsers();
        toast.success('User deleted successfully');
      } else {
        toast.error('Supabase not available');
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Failed to delete user:', error);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateUser(userId, updates);
        await loadUsers();
        toast.success('User updated successfully');
      } else {
        toast.error('Supabase not available');
      }
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Failed to update user:', error);
    }
  };

  return (
    <Card>
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
            onClick={loadUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsAddUserOpen(true)}
            disabled={!isSupabaseAvailable()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isSupabaseAvailable() && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Supabase is not configured. Please check your configuration to manage users.
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
