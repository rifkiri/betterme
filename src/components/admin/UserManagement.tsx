
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from './UserTable';
import { AddUserDialog } from './AddUserDialog';
import { User } from '@/types/userTypes';
import { UserPlus, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
        setIsAdmin(profile?.role === 'admin');
        
        if (profile?.role === 'admin') {
          loadUsers();
        }
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    }
  };

  // Load users from Supabase
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading users from Supabase...');
      const supabaseUsers = await supabaseDataService.getUsers();
      setUsers(supabaseUsers);
      console.log('Users loaded from Supabase successfully');
    } catch (error) {
      console.error('Failed to load users from Supabase:', error);
      toast.error('Failed to load users from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    if (!isAdmin) {
      toast.error('Only admins can add users');
      return;
    }

    const user: User = {
      ...newUser,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
      hasChangedPassword: false
    };

    try {
      await supabaseDataService.addUser(user);
      await loadUsers();
      toast.success('User profile created successfully. User can now register with their email and temporary password.');
    } catch (error) {
      toast.error('Failed to add user');
      console.error('Failed to add user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    try {
      await supabaseDataService.deleteUser(userId);
      await loadUsers();
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Failed to delete user:', error);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    if (!isAdmin) {
      toast.error('Only admins can update users');
      return;
    }

    try {
      await supabaseDataService.updateUser(userId, updates);
      await loadUsers();
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Failed to update user:', error);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please sign in to access user management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You need to be signed in to manage users.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Admin Access Required
          </CardTitle>
          <CardDescription>
            Only administrators can access user management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your current role: {currentUser.role}. Contact an administrator for access.
          </p>
        </CardContent>
      </Card>
    );
  }

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
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Adding a user creates a profile entry. The user will need to register with their email and temporary password to complete account setup.
          </AlertDescription>
        </Alert>
        
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
