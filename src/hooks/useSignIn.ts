
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
    console.log('Checking for pending user with email:', email);
    
    // Check for pending user with matching email and password
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .eq('email', email)
      .eq('temporary_password', password);

    console.log('Pending users query result:', pendingUsers, pendingError);

    if (pendingError) {
      console.error('Error querying pending users:', pendingError);
      toast.error('Error checking user status');
      return false;
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('No pending user found with matching email and password');
      toast.error('Invalid email or password');
      return false;
    }

    const pendingUser = pendingUsers[0];
    console.log('Found pending user:', pendingUser);

    // Try to create auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: pendingUser.email,
      password: password,
    });

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      toast.error('Failed to create account: ' + signUpError.message);
      return false;
    }

    if (signUpData.user) {
      // Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          name: pendingUser.name,
          email: pendingUser.email,
          role: pendingUser.role as 'admin' | 'manager' | 'team-member',
          position: pendingUser.position,
          has_changed_password: false
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        toast.error('Error creating profile: ' + profileError.message);
        return false;
      }

      // Remove from pending_users table
      const { error: deleteError } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', pendingUser.id);

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
      console.log('Attempting to sign in with email:', email);
      
      // First, try regular sign in
      const regularResult = await handleRegularSignIn();
      
      if (regularResult === true) {
        return; // Successfully signed in
      }
      
      // If regular sign in failed, try pending user flow
      if (regularResult && regularResult.error) {
        console.log('Regular sign in failed, trying pending user flow');
        await handlePendingUserSignIn();
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
