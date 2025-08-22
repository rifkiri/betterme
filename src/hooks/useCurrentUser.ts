
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCurrentUser = () => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkCurrentUser = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setCurrentUser(profile);
          setIsAdmin(profile?.role === 'admin');
        } catch (error) {
          console.error('Error checking current user');
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };

    checkCurrentUser();
  }, [user]);

  return {
    currentUser,
    isAdmin,
    checkCurrentUser: () => {} // No longer needed with AuthContext
  };
};
