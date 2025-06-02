
import { RegularSignInService } from '@/services/auth/RegularSignInService';
import { PendingUserSignUpService } from '@/services/auth/PendingUserSignUpService';

export class SignInService {
  static async handleRegularSignIn(email: string, password: string, navigate: (path: string) => void): Promise<boolean> {
    return await RegularSignInService.handleRegularSignIn(email, password, navigate);
  }

  static async handlePendingUserFlow(email: string, password: string, navigate: (path: string) => void): Promise<void> {
    return await PendingUserSignUpService.handlePendingUserFlow(email, password, navigate);
  }
}
