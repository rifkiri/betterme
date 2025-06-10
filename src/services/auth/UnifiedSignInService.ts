
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectPath } from '@/utils/navigationUtils';

export class UnifiedSignInService {
  static async handleSignIn(email: string, password: string, navigate: (path: string) => void): Promise<boolean> {
    console.log('=== COMPREHENSIVE SIGN IN DEBUG START ===');
    console.log('Email provided:', email);
    console.log('Password length:', password.length);
    console.log('Current timestamp:', new Date().toISOString());
    
    const sanitizedEmail = email.trim().toLowerCase();
    console.log('Sanitized email:', sanitizedEmail);
    
    // Check if user exists in auth.users first
    console.log('=== CHECKING AUTH.USERS TABLE ===');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('❌ Cannot check auth users (admin access required):', authError);
      } else {
        const userExists = authUsers.users.find(u => u.email?.toLowerCase() === sanitizedEmail);
        console.log('User exists in auth.users:', !!userExists);
        if (userExists) {
          console.log('Auth user details:', {
            id: userExists.id,
            email: userExists.email,
            emailConfirmed: userExists.email_confirmed_at,
            lastSignIn: userExists.last_sign_in_at,
            createdAt: userExists.created_at
          });
        }
      }
    } catch (e) {
      console.log('Note: Cannot check auth.users (normal for client-side)');
    }

    // Check profiles table
    console.log('=== CHECKING PROFILES TABLE ===');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();
    
    console.log('Profile lookup result:', { 
      found: !!profileData, 
      error: profileError?.message,
      profile: profileData 
    });

    // Try authentication with different approaches
    console.log('=== ATTEMPTING AUTHENTICATION ===');
    
    // First attempt: Direct auth
    console.log('Attempt 1: Standard signInWithPassword');
    const { data: signInData, error: signInError } = await AuthService.signInWithPassword(email, password);
    console.log('Standard auth result:', { 
      success: !signInError, 
      error: signInError?.message,
      errorCode: 'status' in signInError ? signInError.status : 'unknown',
      userId: signInData.user?.id 
    });

    if (!signInError && signInData.user) {
      console.log('✅ Authentication successful!');
      console.log('Authenticated user:', {
        id: signInData.user.id,
        email: signInData.user.email,
        role: signInData.user.role
      });
      
      // Handle successful authentication
      if (profileData) {
        console.log('Profile found, proceeding with login');
        
        // Check if user needs to change password
        if (!profileData.has_changed_password || profileData.temporary_password) {
          console.log('🔄 User needs to change password');
          toast.success('Welcome! Please change your temporary password.');
          await ProfileService.updateProfileLogin(signInData.user.id, true);
          navigate('/profile');
          return true;
        }
        
        console.log('✅ Complete login successful');
        await AuthService.updateLastLogin(signInData.user.id);
        await ProfileService.updateProfileLogin(signInData.user.id, true);
        toast.success('Welcome back!');
        navigate(getRedirectPath(profileData.role));
        return true;
      } else {
        console.log('⚠️ No profile found for authenticated user');
        toast.error('User profile not found. Please contact an administrator.');
        return false;
      }
    }

    // If standard auth failed, check for specific error types
    console.log('=== AUTHENTICATION FAILED ANALYSIS ===');
    if (signInError) {
      console.log('Error details:', {
        message: signInError.message,
        status: 'status' in signInError ? signInError.status : 'unknown',
        name: 'name' in signInError ? signInError.name : 'unknown'
      });

      // Check if it's a credential issue vs other issues
      if (signInError.message?.includes('Invalid login credentials')) {
        console.log('🔍 Invalid credentials detected');
        
        if (profileData) {
          console.log('Profile exists but auth failed - checking temporary password');
          
          // Check if user has temporary password
          if (profileData.temporary_password) {
            console.log('Temporary password found, comparing...');
            console.log('Provided password matches temp?', password === profileData.temporary_password);
            
            if (password === profileData.temporary_password) {
              console.log('🔄 Correct temporary password provided');
              toast.error('Please use your permanent password, not the temporary one. If you haven\'t changed it yet, please contact an administrator.');
              return false;
            }
          }
          
          console.log('❌ Profile exists but credentials don\'t match');
          toast.error('Invalid email or password. Please check your credentials and try again.');
          return false;
        } else {
          console.log('❌ No profile found and auth failed');
          toast.error('User account not found. Please contact an administrator.');
          return false;
        }
      } else {
        console.log('❌ Non-credential authentication error');
        toast.error(`Login failed: ${signInError.message}`);
        return false;
      }
    }

    console.log('❌ Unexpected authentication state');
    console.log('=== COMPREHENSIVE SIGN IN DEBUG END ===');
    toast.error('Login failed. Please try again or contact support.');
    return false;
  }
}
