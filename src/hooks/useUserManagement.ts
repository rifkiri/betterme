
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
      console.error('Error checking current user'); // No sensitive data logged
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading users from Supabase'); // No sensitive data logged
      const supabaseUsers = await supabaseDataService.getUsers();
      setUsers(supabaseUsers);
      console.log('Users loaded successfully'); // No sensitive data logged
    } catch (error) {
      console.error('Failed to load users'); // No sensitive data logged
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

    // Input validation and sanitization
    const sanitizedUser = {
      name: newUser.name?.trim().slice(0, 100) || '',
      email: newUser.email?.trim().toLowerCase().slice(0, 255) || '',
      role: newUser.role || 'team-member',
      position: newUser.position?.trim().slice(0, 100) || '',
      temporaryPassword: newUser.temporaryPassword || ''
    };

    // Validate required fields
    if (!sanitizedUser.name || !sanitizedUser.email || !sanitizedUser.temporaryPassword) {
      toast.error('Name, email, and temporary password are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedUser.email)) {
      toast.error('Invalid email format');
      return;
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'team-member'];
    if (!validRoles.includes(sanitizedUser.role)) {
      toast.error('Invalid role');
      return;
    }

    try {
      console.log('Creating user via Edge Function');
      
      // Call the Edge Function to create the user with the provided temporary password
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          name: sanitizedUser.name,
          email: sanitizedUser.email,
          role: sanitizedUser.role,
          position: sanitizedUser.position,
          temporaryPassword: sanitizedUser.temporaryPassword
        }
      });

      if (error) {
        console.error('Edge function error');
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      if (!data.success) {
        console.error('User creation failed');
        toast.error('Failed to create user: ' + data.error);
        return;
      }

      await loadUsers();
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to add user');
      console.error('Failed to add user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    try {
      console.log('Deleting user via Edge Function:', userId);
      
      // Call the Edge Function to delete the user from both profiles and auth.users
      const { data, error } = await supabase.functions.invoke('delete-auth-users', {
        body: {
          userIds: [userId]
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Failed to delete user: ' + error.message);
        return;
      }

      if (!data.success) {
        console.error('User deletion failed:', data.error);
        toast.error('Failed to delete user: ' + data.error);
        return;
      }

      // Check deletion results
      const results = data.results || [];
      const failedDeletions = results.filter(r => !r.success);
      
      if (failedDeletions.length > 0) {
        console.error('Some deletions failed:', failedDeletions);
        toast.error('Failed to completely delete user from authentication system');
      } else {
        toast.success('User deleted successfully from both profile and authentication system');
      }

      await loadUsers();
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
      // If updating with a new temporary password, also reset the password change status
      if (updates.temporaryPassword) {
        updates.hasChangedPassword = false;
        updates.userStatus = 'pending';
      }

      await supabaseDataService.updateUser(userId, updates);
      await loadUsers();
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Failed to update user'); // No sensitive data logged
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
