
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserRole } from '@/types/userTypes';
import { toast } from 'sonner';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

export const EditUserDialog = ({
  open,
  onOpenChange,
  user,
  onUpdateUser
}: EditUserDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('team-member');
  const [position, setPosition] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPosition(user.position || '');
      setNewPassword('');
    }
  }, [user]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !email || !role) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('=== EDIT USER SUBMIT DEBUG ===');
    console.log('Original user email:', user.email);
    console.log('New email:', email);
    console.log('Email changed:', user.email !== email);

    const updates: Partial<User> = {
      name,
      email,
      role,
      position: position || undefined
    };

    // If a new password is provided, reset the password
    if (newPassword) {
      updates.temporaryPassword = newPassword;
      updates.hasChangedPassword = false;
    }

    try {
      await onUpdateUser(user.id, updates);
      
      if (newPassword) {
        toast.success('User updated and password reset successfully');
      } else if (user.email !== email) {
        toast.success('User updated and email synced with authentication system');
      } else {
        toast.success('User updated successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and organizational position. Email changes will be synced with the authentication system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input 
                id="edit-name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Enter full name" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter email address" 
                required 
              />
              {user.email !== email && (
                <p className="text-sm text-blue-600">
                  ⚠️ Email will be updated in both profile and authentication system
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-member">Team Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Input 
                id="edit-position" 
                value={position} 
                onChange={e => setPosition(e.target.value)} 
                placeholder="e.g. Senior Developer" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-password">Reset Password (Optional)</Label>
            <div className="flex gap-2">
              <Input 
                id="edit-password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Leave empty to keep current password" 
              />
              <Button type="button" variant="outline" onClick={generatePassword}>
                Generate
              </Button>
            </div>
            {newPassword && (
              <p className="text-sm text-muted-foreground">
                User will need to change this password on next login
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
