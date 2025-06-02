
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectPath } from '@/utils/navigationUtils';

export class UnifiedSignInService {
  static async handleSignIn(email: string, password: string, navigate: (path: string) => void): Promise<boolean> {
    // First, try regular sign in
    const { data: signInData, error: signInError } = await AuthService.signInWithPassword(email, password);

    if (!signInError && signInData.user) {
      console.log('Regular sign in successful');
      
      const { profile, error: profileError } = await ProfileService.getProfile(signInData.user.id);

      if (!profileError && profile) {
        console.log('User profile found:', profile);
        
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
    console.log('Regular sign in failed, checking for user with temporary password');
    
    // Query the profiles table directly
    const { data: existingUserData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user by email:', userError);
      toast.error('Error checking user credentials');
      return false;
    }

    if (!existingUserData) {
      console.log('No user found with email:', email);
      toast.error('Invalid email or password');
      return false;
    }

    const existingUser = {
      id: existingUserData.id,
      name: existingUserData.name || '',
      email: existingUserData.email || '',
      role: existingUserData.role || 'team-member',
      position: existingUserData.position || '',
      temporaryPassword: existingUserData.temporary_password || undefined,
      hasChangedPassword: existingUserData.has_changed_password || false,
      userStatus: existingUserData.user_status || 'active',
      createdAt: existingUserData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      lastLogin: existingUserData.last_login?.split('T')[0],
      managerId: existingUserData.manager_id || undefined
    };

    // Check if this is a temporary password login attempt
    if (existingUser.temporaryPassword && existingUser.temporaryPassword === password) {
      console.log('User attempting to sign in with temporary password');
      
      // If user has auth account but is using temp password, they need to change it
      if (existingUser.userStatus === 'active') {
        toast.error('Please sign in with your regular password, not the temporary one. If you forgot your password, contact an administrator.');
        return false;
      }
      
      // This is a pending user trying to activate their account
      if (existingUser.userStatus === 'pending') {
        // Create auth user for pending user
        const { data: signUpData, error: signUpError } = await AuthService.signUpWithPassword(existingUser.email, password);

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
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            toast.error('Error updating profile: ' + updateError.message);
            return false;
          }

          // Create new profile with auth user ID
          const { error: profileError } = await ProfileService.createProfile(signUpData.user.id, {
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            position: existingUser.position,
            temporaryPassword: existingUser.temporaryPassword
          });

          if (!profileError) {
            // Delete the old profile entry
            await supabase
              .from('profiles')
              .delete()
              .eq('id', existingUser.id);
            
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
    toast.error('Invalid email or password');
    return false;
  }
}
