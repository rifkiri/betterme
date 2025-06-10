
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectPath } from '@/utils/navigationUtils';

export class UnifiedSignInService {
  static async handleSignIn(email: string, password: string, navigate: (path: string) => void): Promise<boolean> {
    console.log('=== ENHANCED SIGN IN DEBUG START ===');
    console.log('Email provided:', email);
    console.log('Password length:', password.length);
    
    const sanitizedEmail = email.trim().toLowerCase();
    console.log('Sanitized email:', sanitizedEmail);
    
    // First, try regular authentication with Supabase Auth
    console.log('=== ATTEMPTING SUPABASE AUTH ===');
    const { data: signInData, error: signInError } = await AuthService.signInWithPassword(email, password);
    console.log('Supabase Auth result:', { 
      success: !signInError, 
      error: signInError?.message,
      userId: signInData.user?.id 
    });

    if (!signInError && signInData.user) {
      console.log('✅ Successfully authenticated with Supabase Auth');
      console.log('User ID:', signInData.user.id);
      console.log('User email:', signInData.user.email);
      
      // Now check if user exists in profiles
      console.log('=== CHECKING PROFILES TABLE ===');
      const { data: existingUserData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)  // Check by user ID, not email
        .maybeSingle();
      
      console.log('Profile lookup by ID result:', { 
        found: !!existingUserData, 
        error: userError?.message,
        profile: existingUserData 
      });

      if (userError) {
        console.error('❌ Error fetching user profile:', userError);
        toast.error('Error checking user profile');
        return false;
      }

      if (existingUserData) {
        console.log('✅ Found user profile:', { 
          id: existingUserData.id,
          email: existingUserData.email, 
          role: existingUserData.role,
          status: existingUserData.user_status,
          hasChangedPassword: existingUserData.has_changed_password,
          hasTemporaryPassword: !!existingUserData.temporary_password
        });
        
        // Check if user needs to change password
        if (!existingUserData.has_changed_password || existingUserData.temporary_password) {
          console.log('🔄 User needs to change password');
          toast.success('Welcome! Please change your temporary password.');
          
          await ProfileService.updateProfileLogin(signInData.user.id, true);
          navigate('/profile');
          return true;
        }
        
        console.log('✅ User login successful, redirecting to dashboard');
        await AuthService.updateLastLogin(signInData.user.id);
        await ProfileService.updateProfileLogin(signInData.user.id, true);
        toast.success('Welcome back!');
        navigate(getRedirectPath(existingUserData.role));
        return true;
      } else {
        console.log('⚠️ User authenticated but no profile found');
        console.log('Checking if profile exists with email match...');
        
        // Fallback: check by email
        const { data: emailProfile, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', sanitizedEmail)
          .maybeSingle();
          
        console.log('Profile lookup by email result:', { 
          found: !!emailProfile, 
          error: emailError?.message,
          profile: emailProfile 
        });
        
        if (emailProfile) {
          console.log('🔧 Found profile by email, updating ID to match Auth user');
          // Update the profile ID to match the Auth user ID
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id: signInData.user.id })
            .eq('email', sanitizedEmail);
            
          if (updateError) {
            console.error('❌ Failed to update profile ID:', updateError);
            toast.error('Error syncing user profile. Please contact an administrator.');
            return false;
          }
          
          console.log('✅ Profile ID updated successfully');
          await AuthService.updateLastLogin(signInData.user.id);
          await ProfileService.updateProfileLogin(signInData.user.id, true);
          toast.success('Welcome back! Profile synced successfully.');
          navigate(getRedirectPath(emailProfile.role));
          return true;
        }
        
        console.log('❌ No profile found by ID or email');
        toast.error('User profile not found. Please contact an administrator to set up your profile.');
        return false;
      }
    }

    console.log('❌ Authentication failed:', signInError?.message);
    
    // If regular auth failed, check for pending users with temporary passwords
    console.log('=== CHECKING FOR PENDING USERS ===');
    const { data: pendingUserData, error: pendingError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();
    
    if (pendingError) {
      console.error('❌ Error checking pending users:', pendingError);
      toast.error('Error checking user credentials');
      return false;
    }

    if (pendingUserData) {
      console.log('Found pending user:', { 
        email: pendingUserData.email, 
        status: pendingUserData.user_status,
        hasTemporaryPassword: !!pendingUserData.temporary_password,
        hasChangedPassword: pendingUserData.has_changed_password,
        role: pendingUserData.role
      });

      // For pending users, try temporary password
      if (pendingUserData.user_status === 'pending' && pendingUserData.temporary_password) {
        if (pendingUserData.temporary_password === password) {
          console.log('🔄 Pending user with correct temporary password');
          
          const { data: tempSignInData, error: tempSignInError } = await AuthService.signInWithPassword(pendingUserData.email, pendingUserData.temporary_password);
          
          if (!tempSignInError && tempSignInData.user) {
            console.log('✅ Pending user signed in with temporary password');
            await ProfileService.updateProfileLogin(tempSignInData.user.id, true);
            toast.success('Welcome! Please change your temporary password.');
            navigate('/profile');
            return true;
          } else {
            console.error('❌ Failed to sign in with temporary password:', tempSignInError);
            toast.error('Authentication failed. Please contact an administrator.');
            return false;
          }
        } else {
          console.log('❌ Incorrect temporary password');
          toast.error('Invalid temporary password');
          return false;
        }
      }
    }

    console.log('❌ No valid authentication path found');
    console.log('=== ENHANCED SIGN IN DEBUG END ===');
    
    // Show appropriate error message
    if (signInError?.message?.includes('Invalid login credentials')) {
      toast.error('Invalid email or password. Please check your credentials and try again.');
    } else {
      toast.error('Login failed. Please try again or contact support.');
    }
    
    return false;
  }
}
