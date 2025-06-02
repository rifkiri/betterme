
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserRole } from '@/types/userTypes';
import { toast } from 'sonner';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
}

export const AddUserDialog = ({
  open,
  onOpenChange,
  onAddUser
}: AddUserDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('team-member');
  const [position, setPosition] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTemporaryPassword(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role || !temporaryPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    onAddUser({
      name,
      email,
      role,
      position: position || undefined,
      temporaryPassword,
      hasChangedPassword: false,
      userStatus: 'pending'
    });
    toast.success('User added successfully');

    // Reset form
    setName('');
    setEmail('');
    setRole('team-member');
    setPosition('');
    setTemporaryPassword('');
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with a temporary password.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name*</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role*</Label>
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
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Senior Developer" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <div className="flex gap-2">
              <Input id="password" value={temporaryPassword} onChange={e => setTemporaryPassword(e.target.value)} placeholder="Enter temporary password" required />
              <Button type="button" variant="outline" onClick={generatePassword}>
                Generate
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};
