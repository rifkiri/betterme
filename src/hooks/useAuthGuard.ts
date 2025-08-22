import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useAuthGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🛡️ Auth guard check:', !!session);
        
        if (mounted && !session) {
          console.log('🛡️ No session found, redirecting to sign in');
          navigate('/signin');
        }
      } catch (error) {
        console.error('❌ Auth guard error:', error);
        if (mounted) {
          navigate('/signin');
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🛡️ Auth guard state change:', event, !!session);
        if (mounted && !session) {
          navigate('/signin');
        }
      }
    );

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);
};