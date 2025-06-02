
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
    
    // First, try regular sign in
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

    // If regular sign in failed, check if user exists with temporary password
    console.log('=== CHECKING FOR TEMPORARY PASSWORD USER ===');
    
    // Try multiple email formats to find the user
    const emailVariants = [
      email.trim().toLowerCase(),
      email.trim(),
      email.toLowerCase(),
      email
    ];
    
    let existingUserData = null;
    let userError = null;
    
    for (const emailVariant of emailVariants) {
      console.log('Checking email variant:', emailVariant);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailVariant)
        .maybeSingle();
      
      if (data) {
        existingUserData = data;
        userError = error;
        console.log('Found user with email variant:', emailVariant);
        break;
      }
    }
    
    if (userError) {
      console.error('Error fetching user by email:', userError);
      toast.error('Error checking user credentials');
      return false;
    }

    if (!existingUserData) {
      console.log('No user found with any email variant');
      console.log('=== SIGN IN DEBUG END ===');
      toast.error('Invalid email or password');
      return false;
    }

    console.log('Found user data:', { 
      email: existingUserData.email, 
      status: existingUserData.user_status,
      hasPassword: !!existingUserData.temporary_password,
      hasChangedPassword: existingUserData.has_changed_password
    });

    // Check if this is a temporary password login attempt
    if (existingUserData.temporary_password && existingUserData.temporary_password === password) {
      console.log('User attempting to sign in with temporary password');
      
      // If user has auth account but is using temp password, they need to change it
      if (existingUserData.user_status === 'active') {
        toast.error('Please sign in with your regular password, not the temporary one. If you forgot your password, contact an administrator.');
        return false;
      }
      
      // This is a pending user trying to activate their account
      if (existingUserData.user_status === 'pending') {
        console.log('Creating auth user for pending user');
        
        // Create auth user for pending user
        const { data: signUpData, error: signUpError } = await AuthService.signUpWithPassword(existingUserData.email, password);

        if (signUpError) {
          console.error('Error creating auth user:', signUpError);
          
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            console.log('User already exists - they should sign in normally');
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
    }

    console.log('Invalid credentials provided');
    console.log('=== SIGN IN DEBUG END ===');
    toast.error('Invalid email or password');
    return false;
  }
}
