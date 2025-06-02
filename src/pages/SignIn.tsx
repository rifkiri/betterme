
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { localDataService } from '@/services/LocalDataService';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting to authenticate user:', email);
      
      // Fetch users from local storage
      const users = localDataService.getUsers();
      console.log('Fetched users from local storage:', users.length);
      
      // Find user by email and password
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        (u.temporaryPassword === password)
      );
      
      if (user) {
        console.log('User found, logging in:', user.email, user.role);
        
        // Store authenticated user
        localStorage.setItem('authUser', JSON.stringify({
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email
        }));
        
        // Update last login
        localDataService.updateUser(user.id, {
          lastLogin: new Date().toISOString().split('T')[0]
        });
        
        toast.success('Sign in successful!');
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/settings');
        } else if (user.role === 'manager') {
          navigate('/manager');
        } else {
          navigate('/');
        }
      } else {
        console.log('Invalid credentials for email:', email);
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    }
    
    setIsLoading(false);
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
              <p><strong>Admin:</strong> admin@company.com / admin123</p>
              <p><strong>Manager:</strong> sarah@company.com / manager123</p>
              <p><strong>Developer:</strong> mike@company.com / dev123</p>
              <p><strong>Designer:</strong> lisa@company.com / design123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
