
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { PendingUserService } from '@/services/PendingUserService';
import { getRedirectPath } from '@/utils/navigationUtils';

export const useSignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegularSignIn = async () => {
    const { data: signInData, error: signInError } = await AuthService.signInWithPassword(email, password);

    if (!signInError && signInData.user) {
      console.log('Regular sign in successful');
      
      const { profile, error: profileError } = await ProfileService.getProfile(signInData.user.id);

      if (!profileError && profile) {
        console.log('User profile found:', profile);
        
        // Clean up any remaining pending user data for this email
        const { data: pendingUsers } = await PendingUserService.getPendingUsers(signInData.user.email || '');
        if (pendingUsers && pendingUsers.length > 0) {
          console.log('Cleaning up remaining pending user data...');
          for (const pendingUser of pendingUsers) {
            await PendingUserService.removePendingUser(pendingUser.id);
          }
        }
        
        if (!profile.has_changed_password) {
          console.log('User needs to change password');
          toast.success('Welcome! Please change your temporary password.');
          
          await ProfileService.updateProfileLogin(signInData.user.id, true);
          navigate('/profile');
          return true;
        }
        
        await AuthService.updateLastLogin(signInData.user.id);
        toast.success('Welcome back!');
        navigate(getRedirectPath(profile.role));
        return true;
      } else {
        console.log('No profile found for authenticated user, checking pending users...');
        return await handleMissingProfile(signInData.user.id, signInData.user.email || '');
      }
    }

    return false;
  };

  const handleMissingProfile = async (userId: string, userEmail: string) => {
    const { data: pendingUsers, error: pendingError } = await PendingUserService.getPendingUsers(userEmail);

    if (!pendingError && pendingUsers && pendingUsers.length > 0) {
      const pendingUser = pendingUsers[0];
      console.log('Found pending user data, checking if profile already exists...');
      
      // Check if profile already exists before creating
      const { profile: existingProfile } = await ProfileService.getProfile(userId);
      
      if (existingProfile) {
        console.log('Profile already exists, proceeding with login...');
        // Remove ALL pending user records for this email to prevent duplicates
        console.log('Removing all pending user records for this email...');
        for (const user of pendingUsers) {
          await PendingUserService.removePendingUser(user.id);
        }
        
        if (!existingProfile.has_changed_password) {
          toast.success('Welcome! Please change your temporary password.');
          await ProfileService.updateProfileLogin(userId, true);
          navigate('/profile');
        } else {
          await AuthService.updateLastLogin(userId);
          toast.success('Welcome back!');
          navigate(getRedirectPath(existingProfile.role));
        }
        return true;
      } else {
        console.log('Creating new profile from pending user...');
        const { error: createProfileError } = await ProfileService.createProfile(userId, pendingUser);

        if (!createProfileError) {
          // Remove ALL pending user records for this email to prevent duplicates
          console.log('Removing all pending user records for this email...');
          for (const user of pendingUsers) {
            await PendingUserService.removePendingUser(user.id);
          }
          console.log('Profile created successfully from pending user');
          toast.success('Welcome! Please change your temporary password.');
          navigate('/profile');
          return true;
        } else {
          console.error('Error creating profile from pending user:', createProfileError);
          toast.error('Error setting up profile: ' + createProfileError.message);
        }
      }
    } else {
      console.error('No profile and no pending user found');
      toast.error('Error loading user profile');
    }

    return false;
  };

  const handlePendingUserFlow = async () => {
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
        toast.success('Account created successfully! Please check your email to confirm your account, then sign in again.');
        setEmail('');
        setPassword('');
      } else {
        console.log('Creating profile from pending user...');
        const { error: profileError } = await ProfileService.createProfile(signUpData.user.id, matchingUser);

        if (!profileError) {
          // Remove ALL pending user records for this email to prevent duplicates
          console.log('Removing all pending user records for this email...');
          for (const user of pendingUsers) {
            await PendingUserService.removePendingUser(user.id);
          }
          toast.success('Account created successfully! Please check your email to confirm your account, then sign in again.');
          setEmail('');
          setPassword('');
        } else {
          console.error('Error creating profile:', profileError);
          toast.error('Error creating profile: ' + profileError.message);
        }
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const regularSignInSuccess = await handleRegularSignIn();
      
      if (!regularSignInSuccess) {
        await handlePendingUserFlow();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    handleSignIn
  };
};
