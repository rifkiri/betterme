
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface UserPermissionGuardProps {
  currentUser: any;
  isAdmin: boolean;
  children: React.ReactNode;
}

export const UserPermissionGuard = ({ currentUser, isAdmin, children }: UserPermissionGuardProps) => {
  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please sign in to access user management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You need to be signed in to manage users.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Admin Access Required
          </CardTitle>
          <CardDescription>
            Only administrators can access user management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your current role: {currentUser.role}. Contact an administrator for access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
