
import React from 'react';
import { AppNavigation } from '@/components/AppNavigation';
import { AdminDashboard } from '@/components/AdminDashboard';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <AdminDashboard />
    </div>
  );
};

export default Admin;
