
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UnifiedSignInService } from '@/services/auth/UnifiedSignInService';

export const useAuthFlow = () => {
  const navigate = useNavigate();

  const executeSignIn = async (
    email: string, 
    password: string, 
    setIsLoading: (loading: boolean) => void
  ) => {
    setIsLoading(true);

    try {
      await UnifiedSignInService.handleSignIn(email, password, navigate);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeSignIn
  };
};
