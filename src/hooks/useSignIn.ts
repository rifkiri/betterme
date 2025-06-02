
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useSignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegularSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error loading user profile');
        return false;
      }

      console.log('User profile:', profile);
      toast.success('Sign in successful!');
      
      // Redirect based on role
      if (profile.role === 'admin') {
        navigate('/settings');
      } else if (profile.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/');
      }
      return true;
    }

    return { error };
  };

  const handlePendingUserSignIn = async () => {
    console.log('Regular sign in failed, checking for pending user...');
    
    // First, let's see if any pending users exist at all
    const { data: allPendingUsers, error: listError } = await supabase
      .from('pending_users')
      .select('*');
    
    console.log('All pending users:', allPendingUsers);
    
    // Now check for this specific user
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .eq('email', email);

    console.log('Pending users for email:', pendingUsers);

    if (pendingError) {
      console.error('Error querying pending users:', pendingError);
      toast.error('Error checking user status');
      return false;
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('No pending user found for email:', email);
      toast.error('Invalid email or password');
      return false;
    }

    // Check if password matches any of the pending users
    const matchingUser = pendingUsers.find(user => user.temporary_password === password);
    
    if (!matchingUser) {
      console.log('No pending user with matching password found');
      toast.error('Invalid email or password');
      return false;
    }

    console.log('Found matching pending user, creating auth account...');
    
    // Try to sign up first
    let authUser = null;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: matchingUser.email,
      password: password,
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('User already exists in auth, trying to sign in...');
        
        const { data: adminSignInData, error: adminSignInError } = await supabase.auth.signInWithPassword({
          email: matchingUser.email,
          password: password,
        });

        if (!adminSignInError && adminSignInData.user) {
          authUser = adminSignInData.user;
          console.log('Successfully signed in existing auth user');
        } else {
          console.error('Failed to sign in existing user:', adminSignInError);
          toast.error('Account setup failed. Please contact admin.');
          return false;
        }
      } else {
        console.error('Error creating auth user:', signUpError);
        toast.error('Failed to create account: ' + signUpError.message);
        return false;
      }
    } else if (signUpData.user) {
      authUser = signUpData.user;
      console.log('Successfully created new auth user');
    }

    if (authUser) {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!existingProfile) {
        // Create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            name: matchingUser.name,
            email: matchingUser.email,
            role: matchingUser.role as 'admin' | 'manager' | 'team-member',
            position: matchingUser.position,
            has_changed_password: false
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          toast.error('Error creating profile: ' + profileError.message);
          return false;
        }
      } else {
        console.log('Profile already exists for user');
      }

      // Remove from pending_users table
      const { error: deleteError } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', matchingUser.id);

      if (deleteError) {
        console.error('Error removing pending user:', deleteError);
      }

      console.log('Successfully created account from pending user');
      toast.success('Account created successfully! Please change your password.');
      
      // Redirect to profile page to change password
      navigate('/profile');
      return true;
    }

    return false;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting to sign in with Supabase:', email);
      
      // First, try regular sign in
      const regularResult = await handleRegularSignIn();
      
      if (regularResult === true) {
        return; // Successfully signed in
      }
      
      if (regularResult && regularResult.error && regularResult.error.message === 'Invalid login credentials') {
        // Try pending user flow
        await handlePendingUserSignIn();
      } else if (regularResult && regularResult.error) {
        console.error('Supabase auth error:', regularResult.error);
        toast.error(regularResult.error.message);
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
