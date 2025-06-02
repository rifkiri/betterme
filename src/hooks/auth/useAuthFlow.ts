
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SignInService } from '@/services/SignInService';

export const useAuthFlow = () => {
  const navigate = useNavigate();

  const executeSignIn = async (
    email: string, 
    password: string, 
    setIsLoading: (loading: boolean) => void
  ) => {
    setIsLoading(true);

    try {
      const regularSignInSuccess = await SignInService.handleRegularSignIn(email, password, navigate);
      
      if (!regularSignInSuccess) {
        await SignInService.handlePendingUserFlow(email, password, navigate);
      }
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
