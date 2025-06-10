
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectPath } from '@/utils/navigationUtils';

export class UnifiedSignInService {
  static async handleSignIn(email: string, password: string, navigate: (path: string) => void): Promise<boolean> {
    console.log('=== SIGN IN DEBUG START ===');
    console.log('Email provided:', email);
    console.log('Password length:', password.length);
    
    const sanitizedEmail = email.trim().toLowerCase();
    console.log('Sanitized email:', sanitizedEmail);
    
    // First, try regular authentication with Supabase Auth
    console.log('=== ATTEMPTING SUPABASE AUTH FIRST ===');
    const { data: signInData, error: signInError } = await AuthService.signInWithPassword(email, password);
    console.log('Supabase Auth result:', { success: !signInError, error: signInError?.message });

    if (!signInError && signInData.user) {
      console.log('Successfully authenticated with Supabase Auth for user:', signInData.user.id);
      
      // Now check if user exists in profiles
      console.log('=== CHECKING FOR USER IN PROFILES ===');
      const { data: existingUserData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', sanitizedEmail)
        .maybeSingle();
      
      if (userError) {
        console.error('Error fetching user profile:', userError);
        toast.error('Error checking user profile');
        return false;
      }

      console.log('Profile lookup result:', existingUserData);

      if (existingUserData) {
        console.log('Found user profile:', { 
          email: existingUserData.email, 
          role: existingUserData.role,
          status: existingUserData.user_status,
          hasChangedPassword: existingUserData.has_changed_password,
          hasTemporaryPassword: !!existingUserData.temporary_password
        });
        
        // Check if user needs to change password (either first time or admin reset)
        if (!existingUserData.has_changed_password || existingUserData.temporary_password) {
          console.log('User needs to change password');
          toast.success('Welcome! Please change your temporary password.');
          
          await ProfileService.updateProfileLogin(signInData.user.id, true);
          navigate('/profile');
          return true;
        }
        
        await AuthService.updateLastLogin(signInData.user.id);
        await ProfileService.updateProfileLogin(signInData.user.id, true);
        toast.success('Welcome back!');
        navigate(getRedirectPath(existingUserData.role));
        return true;
      } else {
        console.log('No profile found for authenticated user - user may exist in Auth but not in profiles table');
        toast.error('User profile not found. Please contact an administrator to set up your profile.');
        return false;
      }
    }

    // If regular auth failed, check if this might be a pending user with temporary password
    console.log('=== REGULAR AUTH FAILED, CHECKING FOR PENDING USERS ===');
    const { data: existingUserData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user by email:', userError);
      toast.error('Error checking user credentials');
      return false;
    }

    console.log('Profile lookup result for pending user check:', existingUserData);

    if (existingUserData) {
      console.log('Found user data:', { 
        email: existingUserData.email, 
        status: existingUserData.user_status,
        hasTemporaryPassword: !!existingUserData.temporary_password,
        hasChangedPassword: existingUserData.has_changed_password,
        role: existingUserData.role
      });

      // For pending users, use temporary_password as credential
      if (existingUserData.user_status === 'pending' && existingUserData.temporary_password) {
        console.log('User is pending with temporary password');
        if (existingUserData.temporary_password === password) {
          console.log('Pending user with correct temporary password - attempting auth with temp password');
          
          // Use temporary password as the actual login credential
          const { data: tempSignInData, error: tempSignInError } = await AuthService.signInWithPassword(existingUserData.email, existingUserData.temporary_password);
          
          if (!tempSignInError && tempSignInData.user) {
            console.log('Pending user signed in successfully with temporary password');
            
            await ProfileService.updateProfileLogin(tempSignInData.user.id, true);
            toast.success('Welcome! Please change your temporary password.');
            navigate('/profile');
            return true;
          } else {
            console.error('Failed to sign in with temporary password:', tempSignInError);
            toast.error('Authentication failed. Please contact an administrator.');
            return false;
          }
        } else {
          console.log('Pending user with incorrect temporary password');
          toast.error('Invalid temporary password');
          return false;
        }
      }

      // For active users who failed regular auth
      if (existingUserData.user_status === 'active') {
        console.log('Active user failed authentication');
        toast.error('Invalid email or password');
        return false;
      }
    } else {
      console.log('No user found in profiles table with email:', sanitizedEmail);
      toast.error('User not found. Please check your email or contact an administrator.');
      return false;
    }

    console.log('Authentication failed with error:', signInError?.message);
    console.log('=== SIGN IN DEBUG END ===');
    toast.error('Invalid email or password');
    return false;
  }
}
