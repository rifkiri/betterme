import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const {
    user,
    userId,
    isLoading,
    isAuthenticated,
    initialize,
    signOut,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    user,
    userId,
    isLoading,
    isAuthenticated,
    signOut,
  };
};