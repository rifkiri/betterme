
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { PendingUserService } from '@/services/PendingUserService';

export class PendingUserSignUpService {
  static async handlePendingUserFlow(email: string, password: string, navigate: (path: string) => void): Promise<void> {
    console.log('Regular sign in failed, trying pending user flow');
    
    const { data: pendingUsers, error: pendingError } = await PendingUserService.getPendingUsers(email);

    if (pendingError) {
      console.error('Error querying pending users:', pendingError);
      toast.error('Error checking user status: ' + pendingError.message);
      return;
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('No pending user found with email:', email);
      toast.error('Invalid email or password. User not found.');
      return;
    }

    const matchingUser = PendingUserService.findMatchingPendingUser(pendingUsers, password);
    
    if (!matchingUser) {
      console.log('No pending user found with matching password');
      toast.error('Invalid temporary password');
      return;
    }

    console.log('Found matching pending user:', matchingUser);

    const { data: signUpData, error: signUpError } = await AuthService.signUpWithPassword(matchingUser.email, password);

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        console.log('User already exists - they should sign in normally');
        toast.error('Account already exists. Please sign in with your regular credentials.');
        return;
      }
      
      toast.error('Failed to create account: ' + signUpError.message);
      return;
    }

    if (signUpData.user) {
      console.log('Successfully created auth user:', signUpData.user.id);
      
      // Check if profile already exists before creating (in case trigger already created it)
      const { profile: existingProfile } = await ProfileService.getProfile(signUpData.user.id);
      
      if (existingProfile) {
        console.log('Profile already exists (likely created by trigger), proceeding...');
        // Remove ALL pending user records for this email to prevent duplicates
        console.log('Removing all pending user records for this email...');
        for (const user of pendingUsers) {
          await PendingUserService.removePendingUser(user.id);
        }
        toast.success('Welcome! Please change your temporary password.');
        navigate('/profile');
        return;
      } else {
        console.log('Creating profile from pending user...');
        const { error: profileError } = await ProfileService.createProfile(signUpData.user.id, matchingUser);

        if (!profileError) {
          // Remove ALL pending user records for this email to prevent duplicates
          console.log('Removing all pending user records for this email...');
          for (const user of pendingUsers) {
            await PendingUserService.removePendingUser(user.id);
          }
          toast.success('Welcome! Please change your temporary password.');
          navigate('/profile');
          return;
        } else {
          console.error('Error creating profile:', profileError);
          toast.error('Error creating profile: ' + profileError.message);
        }
      }
    }
  }
}
