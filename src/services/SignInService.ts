import { UnifiedSignInService } from '@/services/auth/UnifiedSignInService';

export class SignInService {
  static async handleRegularSignIn(email: string, password: string, navigate: (path: string) => void): Promise<boolean> {
    return await UnifiedSignInService.handleSignIn(email, password, navigate);
  }

  static async handlePendingUserFlow(email: string, password: string, navigate: (path: string) => void): Promise<void> {
    // This is now handled by the unified service, but keeping for compatibility
    await UnifiedSignInService.handleSignIn(email, password, navigate);
  }
}
