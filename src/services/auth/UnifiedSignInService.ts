
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
    
    // First, check if user exists in profiles
    console.log('=== CHECKING FOR USER IN PROFILES ===');
    
    const sanitizedEmail = email.trim().toLowerCase();
    
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

    if (existingUserData) {
      console.log('Found user data:', { 
        email: existingUserData.email, 
        status: existingUserData.user_status,
        hasTemporaryPassword: !!existingUserData.temporary_password,
        hasChangedPassword: existingUserData.has_changed_password
      });

      // For pending users, use temporary_password as credential
      if (existingUserData.user_status === 'pending' && existingUserData.temporary_password) {
        if (existingUserData.temporary_password === password) {
          console.log('Pending user with correct temporary password');
          
          // Try to sign in with temporary password (if auth user already exists)
          const { data: signInData, error: signInError } = await AuthService.signInWithPassword(existingUserData.email, password);
          
          if (!signInError && signInData.user) {
            console.log('Pending user signed in successfully');
            
            // Guide them to change password
            toast.success('Welcome! Please change your temporary password.');
            await ProfileService.updateProfileLogin(signInData.user.id, true);
            navigate('/profile');
            return true;
          } else {
            console.log('Auth user does not exist yet, creating...');
            
            // Create auth user with temporary password
            const { data: signUpData, error: signUpError } = await AuthService.signUpWithPassword(existingUserData.email, password);

            if (signUpError) {
              console.error('Error creating auth user:', signUpError);
              
              if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
                console.log('User already exists in auth - they should sign in normally');
                toast.error('Account already exists. Please sign in with your regular credentials.');
                return false;
              }
              
              toast.error('Failed to create account: ' + signUpError.message);
              return false;
            }

            if (signUpData.user) {
              console.log('Successfully created auth user:', signUpData.user.id);
              
              // Update the existing profile with the new auth user ID
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  id: signUpData.user.id,
                  user_status: 'pending'
                })
                .eq('id', existingUserData.id);

              if (updateError) {
                console.error('Error updating profile:', updateError);
                toast.error('Error updating profile: ' + updateError.message);
                return false;
              }

              // Create new profile with auth user ID
              const { error: profileError } = await ProfileService.createProfile(signUpData.user.id, {
                name: existingUserData.name,
                email: existingUserData.email,
                role: existingUserData.role,
                position: existingUserData.position,
                temporaryPassword: existingUserData.temporary_password
              });

              if (!profileError) {
                // Delete the old profile entry
                await supabase
                  .from('profiles')
                  .delete()
                  .eq('id', existingUserData.id);
                
                toast.success('Welcome! Please change your temporary password.');
                navigate('/profile');
                return true;
              } else {
                console.error('Error creating profile:', profileError);
                toast.error('Error creating profile: ' + profileError.message);
                return false;
              }
            }
          }
        } else {
          console.log('Pending user with incorrect temporary password');
          toast.error('Invalid temporary password');
          return false;
        }
      }

      // For active users, proceed with regular authentication
      if (existingUserData.user_status === 'active') {
        console.log('Active user - proceeding with regular authentication');
        
        // Check if they're mistakenly using temporary password
        if (existingUserData.temporary_password && existingUserData.temporary_password === password) {
          console.log('Active user attempting to sign in with temporary password');
          toast.error('Please sign in with your regular password, not the temporary one. If you forgot your password, contact an administrator.');
          return false;
        }
      }
    }

    // Try regular sign in for active users or users not found in profiles
    console.log('Attempting regular sign in');
    const { data: signInData, error: signInError } = await AuthService.signInWithPassword(email, password);
    console.log('Regular sign in result:', { success: !signInError, error: signInError?.message });

    if (!signInError && signInData.user) {
      console.log('Regular sign in successful for user:', signInData.user.id);
      
      const { profile, error: profileError } = await ProfileService.getProfile(signInData.user.id);
      console.log('Profile lookup result:', { found: !!profile, error: profileError?.message });

      if (!profileError && profile) {
        console.log('User profile found:', { 
          email: profile.email, 
          role: profile.role,
          hasChangedPassword: profile.has_changed_password,
          temporaryPassword: !!profile.temporary_password 
        });
        
        // Check if user needs to change password (either first time or admin reset)
        if (!profile.has_changed_password || profile.temporary_password) {
          console.log('User needs to change password');
          toast.success('Welcome! Please change your temporary password.');
          
          await ProfileService.updateProfileLogin(signInData.user.id, true);
          navigate('/profile');
          return true;
        }
        
        await AuthService.updateLastLogin(signInData.user.id);
        await ProfileService.updateProfileLogin(signInData.user.id, true);
        toast.success('Welcome back!');
        navigate(getRedirectPath(profile.role));
        return true;
      } else {
        console.log('No profile found for authenticated user');
        toast.error('User profile not found');
        return false;
      }
    }

    console.log('Authentication failed');
    console.log('=== SIGN IN DEBUG END ===');
    toast.error('Invalid email or password');
    return false;
  }
}
