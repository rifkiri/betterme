
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { filterUsersForTagging } from '@/utils/userSelectorUtils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UseUserSelectorProps {
  currentUserId?: string;
}

export const useUserSelector = ({ currentUserId }: UseUserSelectorProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current authenticated user to ensure we have the right current user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Use the authenticated user ID as the definitive current user ID
      const actualCurrentUserId = currentUser?.id || currentUserId;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('user_status', 'active');

      if (error) {
        console.error('Error fetching users:', error);
        setError(`Failed to load users: ${error.message}`);
        setUsers([]); // Ensure users is always an array
        return;
      }

      // Filter users using utility function
      const filteredUsers = filterUsersForTagging(data || [], actualCurrentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUserId]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};
