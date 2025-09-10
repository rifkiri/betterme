import { useState } from 'react';
import { User } from '@/types/userTypes';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { toast } from 'sonner';

export const useAdminUsersData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading all users for admin (including pending)');
      const adminUsers = await supabaseDataService.getAllUsersForAdmin();
      console.log('Admin users loaded successfully:', adminUsers.length, 'users');
      setUsers(adminUsers);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      toast.error('Failed to load users from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    users,
    isLoading,
    loadUsers
  };
};