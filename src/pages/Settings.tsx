
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Settings as SettingsIcon, Shield } from "lucide-react";

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

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} lg:w-[400px]`}>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>Configure your app preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">App settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
