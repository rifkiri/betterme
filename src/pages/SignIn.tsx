
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting to sign in with Supabase:', email);
      
      // First, try regular sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && error.message === 'Invalid login credentials') {
        // Check if this is a pending user with temporary password
        console.log('Regular sign in failed, checking for pending user...');
        
        const { data: pendingUser, error: pendingError } = await supabase
          .from('pending_users')
          .select('*')
          .eq('email', email)
          .eq('temporary_password', password)
          .single();

        if (pendingError || !pendingUser) {
          console.error('No pending user found or invalid credentials:', pendingError);
          toast.error('Invalid email or password');
          return;
        }

        console.log('Found pending user, creating auth account...');
        
        // Create the actual Supabase auth user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: pendingUser.email,
          password: password, // Use the temporary password initially
        });

        if (signUpError) {
          console.error('Error creating auth user:', signUpError);
          toast.error('Failed to create account: ' + signUpError.message);
          return;
        }

        if (signUpData.user) {
          // Update the profiles table with the pending user data
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
          }

          // Remove from pending_users table
          await supabase
            .from('pending_users')
            .delete()
            .eq('id', pendingUser.id);

          console.log('Successfully created account from pending user');
          toast.success('Account created successfully! Please change your password.');
          
          // Redirect to profile page to change password
          navigate('/profile');
          return;
        }
      } else if (error) {
        console.error('Supabase auth error:', error);
        toast.error(error.message);
        return;
      }

      if (data.user) {
        console.log('Successfully signed in:', data.user.email);
        
        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
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
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-2">Demo Credentials:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Admin:</strong> rifkiri@gmail.com / [use your Supabase password]</p>
              <p>Users created by admin can sign in with their email and temporary password</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
