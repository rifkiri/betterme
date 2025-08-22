
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileService } from '@/services/ProfileService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getRedirectPath } from '@/utils/navigationUtils';
import { useAuth } from '@/contexts/AuthContext';

interface PasswordChangeFormProps {
  isFirstTime?: boolean;
}

interface PasswordStrength {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
}

export const PasswordChangeForm = ({ isFirstTime = false }: PasswordChangeFormProps) => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Password strength validation
  const getPasswordStrength = (password: string): PasswordStrength => ({
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
  });

  const passwordStrength = getPasswordStrength(newPassword);
  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  // Sanitize input to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    const sanitizedNewPassword = sanitizeInput(newPassword);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    if (sanitizedNewPassword !== sanitizedConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Password does not meet security requirements');
      return;
    }

    if (sanitizedNewPassword.length > 72) {
      toast.error('Password is too long (maximum 72 characters)');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: sanitizedNewPassword
      });

      if (error) {
        console.error('Password update failed'); // No sensitive data logged
        toast.error('Error updating password. Please try again.');
        return;
      }

      // Update the profile to mark password as changed and set status to active
      if (user) {
        await ProfileService.updatePasswordStatus(user.id);
      }

      toast.success('Password updated successfully!');
      
      // If this is first time, redirect to appropriate dashboard
      if (isFirstTime && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          navigate(getRedirectPath(profile.role));
        }
      }
    } catch (error) {
      console.error('Password change error occurred'); // No sensitive data logged
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const StrengthIndicator = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-600' : 'text-red-500'}`}>
      {isValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{text}</span>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isFirstTime ? 'Change Your Temporary Password' : 'Change Password'}
        </CardTitle>
        <CardDescription>
          {isFirstTime 
            ? 'Please change your temporary password to secure your account'
            : 'Enter your new password below'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Password strength indicators */}
            {newPassword && (
              <div className="space-y-1 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <StrengthIndicator isValid={passwordStrength.minLength} text="At least 8 characters" />
                <StrengthIndicator isValid={passwordStrength.hasNumber} text="Contains a number" />
                <StrengthIndicator isValid={passwordStrength.hasUppercase} text="Contains uppercase letter" />
                <StrengthIndicator isValid={passwordStrength.hasLowercase} text="Contains lowercase letter" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
