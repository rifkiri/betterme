
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from './UserTable';
import { AddUserDialog } from './AddUserDialog';
import { User } from '@/types/userTypes';
import { UserPlus, RefreshCw } from 'lucide-react';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';

// Mock users data as fallback
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
  const [isLoading, setIsLoading] = useState(false);
  const [useGoogleSheets, setUseGoogleSheets] = useState(googleSheetsService.isConfigured());

  // Load users from Google Sheets if configured
  const loadUsers = async () => {
    if (!googleSheetsService.isConfigured()) {
      return;
    }

    setIsLoading(true);
    try {
      const sheetsUsers = await googleSheetsService.getUsers();
      if (sheetsUsers.length > 0) {
        setUsers(sheetsUsers);
        setUseGoogleSheets(true);
      }
    } catch (error) {
      console.error('Failed to load users from Google Sheets:', error);
      toast.error('Failed to load users from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...newUser,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (useGoogleSheets && googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.addUser(user);
        await loadUsers(); // Reload from sheets
        toast.success('User added to Google Sheets successfully');
      } catch (error) {
        toast.error('Failed to add user to Google Sheets');
        // Fallback to local state
        setUsers([...users, user]);
      }
    } else {
      setUsers([...users, user]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (useGoogleSheets && googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.deleteUser(userId);
        await loadUsers(); // Reload from sheets
        toast.success('User deleted from Google Sheets successfully');
      } catch (error) {
        toast.error('Failed to delete user from Google Sheets');
        // Fallback to local state
        setUsers(users.filter(user => user.id !== userId));
      }
    } else {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    if (useGoogleSheets && googleSheetsService.isConfigured()) {
      try {
        await googleSheetsService.updateUser(userId, updates);
        await loadUsers(); // Reload from sheets
        toast.success('User updated in Google Sheets successfully');
      } catch (error) {
        toast.error('Failed to update user in Google Sheets');
        // Fallback to local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ));
      }
    } else {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, permissions, and organizational positions
            {useGoogleSheets && (
              <span className="text-green-600"> • Connected to Google Sheets</span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {useGoogleSheets && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <UserTable
          users={users}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
        />
      </CardContent>

      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onAddUser={handleAddUser}
      />
    </Card>
  );
};
