
import { useState, useEffect } from 'react';
import { User } from '@/types/userTypes';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
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

    try {
      // Create the user account first using Supabase auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.temporaryPassword || 'temp123',
        email_confirm: true,
        user_metadata: {
          name: newUser.name,
          role: newUser.role,
          position: newUser.position
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        toast.error('Failed to create user account: ' + authError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create user account');
        return;
      }

      // Now create the profile with the auth user's ID
      const user: User = {
        ...newUser,
        id: authData.user.id,
        createdAt: new Date().toISOString().split('T')[0],
        hasChangedPassword: false,
        userStatus: 'pending'
      };

      await supabaseDataService.addUser(user);
      await loadUsers();
      toast.success('User profile created successfully. User can now sign in with their email and temporary password.');
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

  return {
    users,
    isLoading,
    currentUser,
    isAdmin,
    loadUsers,
    handleAddUser,
    handleDeleteUser,
    handleUpdateUser
  };
};
