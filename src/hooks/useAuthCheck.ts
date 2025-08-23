
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthCheck = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're certain the user is authenticated
    // and we're not still loading
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
};
