
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from './UserTable';
import { AddUserDialog } from './AddUserDialog';
import { User } from '@/types/userTypes';
import { UserPlus } from 'lucide-react';

// Mock users data with position information
const initialUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin',
    position: 'Chief Technology Officer',
    department: 'Technology',
    hasChangedPassword: true,
    createdAt: '2024-01-15',
    lastLogin: '2024-05-31'
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@company.com',
    role: 'manager',
    position: 'Engineering Manager',
    department: 'Engineering',
    manager: 'Admin User',
    hasChangedPassword: true,
    createdAt: '2024-02-01',
    lastLogin: '2024-05-30'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'team-member',
    position: 'Senior Developer',
    department: 'Engineering',
    manager: 'Manager User',
    temporaryPassword: 'temp123',
    hasChangedPassword: false,
    createdAt: '2024-03-15'
  },
  {
    id: '4',
    name: 'Mike Chen',
    email: 'mike@company.com',
    role: 'team-member',
    position: 'Product Manager',
    department: 'Product',
    manager: 'Manager User',
    hasChangedPassword: true,
    createdAt: '2024-03-20',
    lastLogin: '2024-05-29'
  }
];

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleAddUser = (newUser: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...newUser,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, user]);
    // TODO: Add user to Google Sheets
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    // TODO: Remove user from Google Sheets
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
    // TODO: Update user in Google Sheets
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts, permissions, and organizational positions</CardDescription>
          </div>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
          />
        </CardContent>
      </Card>

      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onAddUser={handleAddUser}
      />
    </div>
  );
};
