
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting to sign in with email:', email);
      
      // First, try regular sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData.user) {
        console.log('Regular sign in successful');
        
        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast.error('Error loading user profile');
          return;
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
        return;
      }

      console.log('Regular sign in failed, trying pending user flow');
      console.log('Sign in error:', signInError);
      
      // If regular sign in failed, check for pending user
      console.log('Checking for pending user with email:', email);
      
      const { data: pendingUsers, error: pendingError } = await supabase
        .from('pending_users')
        .select('*')
        .eq('email', email);

      console.log('Pending users query result:', pendingUsers, pendingError);

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

      // Check if password matches any pending user
      const matchingUser = pendingUsers.find(user => user.temporary_password === password);
      
      if (!matchingUser) {
        console.log('No pending user found with matching password');
        toast.error('Invalid temporary password');
        return;
      }

      console.log('Found matching pending user:', matchingUser);

      // Create auth user without email confirmation
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: matchingUser.email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: matchingUser.name,
          role: matchingUser.role
        }
      });

      if (signUpError) {
        console.error('Error creating auth user:', signUpError);
        
        // If user already exists, they may need to sign in normally
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
        
        // Create the profile immediately
        console.log('Creating profile for pending user...');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            name: matchingUser.name,
            email: matchingUser.email,
            role: matchingUser.role as 'admin' | 'manager' | 'team-member',
            position: matchingUser.position,
            has_changed_password: false
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          toast.error('Error creating profile: ' + profileError.message);
          return;
        }

        // Remove from pending_users table
        console.log('Profile created successfully, removing from pending users');
        const { error: deleteError } = await supabase
          .from('pending_users')
          .delete()
          .eq('id', matchingUser.id);

        if (deleteError) {
          console.warn('Could not remove pending user:', deleteError);
          // Don't fail the whole process for this
        }

        // Now sign them in automatically
        console.log('Auto-signing in the new user...');
        const { data: autoSignInData, error: autoSignInError } = await supabase.auth.signInWithPassword({
          email: matchingUser.email,
          password: password,
        });

        if (autoSignInError) {
          console.error('Error auto-signing in user:', autoSignInError);
          toast.success('Account created successfully! Please sign in with your credentials.');
          // Clear the form so they can sign in
          setEmail('');
          setPassword('');
          return;
        }

        if (autoSignInData.user) {
          console.log('Auto sign-in successful');
          toast.success('Account created and signed in successfully!');
          
          // Redirect based on role
          if (matchingUser.role === 'admin') {
            navigate('/settings');
          } else if (matchingUser.role === 'manager') {
            navigate('/manager');
          } else {
            navigate('/');
          }
        }
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
