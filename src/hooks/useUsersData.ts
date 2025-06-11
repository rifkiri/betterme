
import { useState } from 'react';
import { User } from '@/types/userTypes';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { toast } from 'sonner';

export const useUsersData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading users from Supabase');
      const supabaseUsers = await supabaseDataService.getUsers();
      setUsers(supabaseUsers);
      console.log('Users loaded successfully');
    } catch (error) {
      console.error('Failed to load users');
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
