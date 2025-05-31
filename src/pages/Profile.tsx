
import React from "react";
import { useNavigate } from "react-router-dom";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();

  // Get current user from localStorage
  const getCurrentUser = () => {
    const authUser = localStorage.getItem('authUser');
    if (authUser) {
      return JSON.parse(authUser);
    }
    return null;
  };

  const currentUser = getCurrentUser();

  const handleSignOut = () => {
    // Clear authentication data
    localStorage.removeItem('authUser');
    
    // Show success message
    toast.success('Signed out successfully');
    
    // Redirect to sign-in page
    navigate('/signin');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatRole = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {currentUser ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your personal details and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Name</span>
                    </div>
                    <p className="text-gray-900">{currentUser.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-gray-900">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Role</span>
                    </div>
                    <Badge variant={getRoleBadgeVariant(currentUser.role)}>
                      {formatRole(currentUser.role)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account settings and session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSignOut}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No user session found</p>
              <Button onClick={() => navigate('/signin')}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
