import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from './admin/UserManagement';
import { AddUserDialog } from './admin/AddUserDialog';
import { Users, UserPlus, Settings } from 'lucide-react';
export const AdminDashboard = () => {
  return <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users and system settings</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="settings">
          
        </TabsContent>
      </Tabs>
    </div>;
};