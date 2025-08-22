
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { filterUsersForTagging } from '@/utils/userSelectorUtils';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the authenticated user ID as the definitive current user ID
      const actualCurrentUserId = user?.id || currentUserId;
      
      // Use the secure role-based filtering function
      const { data, error } = await supabase
        .rpc('get_filtered_users_for_role');

      if (error) {
        console.error('Error fetching users:', error);
        setError(`Failed to load users: ${error.message}`);
        setUsers([]); // Ensure users is always an array
        return;
      }

      // Transform data and apply additional filtering
      const transformedUsers = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as 'admin' | 'manager' | 'team-member'
      }));

      // Apply final filtering for current user
      const filteredUsers = filterUsersForTagging(transformedUsers, actualCurrentUserId);
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
    if (user?.id) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [user?.id]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};
