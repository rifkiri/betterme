
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboard } from "@/components/AdminDashboard";

// Mock function to get current user role (replace with real authentication)
const getCurrentUserRole = () => {
  const authUser = localStorage.getItem('authUser');
  if (authUser) {
    return JSON.parse(authUser).role;
  }
  return 'team-member';
};

const Settings = () => {
  const userRole = getCurrentUserRole();
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your app preferences and system settings</p>
        </div>

        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Access restricted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You don't have permission to access settings. Please contact your administrator.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
