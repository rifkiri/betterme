
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const DemoCredentials = () => {
  const checkPendingUsers = async () => {
    console.log('Checking pending users table...');
    const { data, error } = await supabase
      .from('pending_users')
      .select('*');
    
    console.log('Pending users data:', data);
    console.log('Pending users error:', error);
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-sm text-blue-900 mb-2">Demo Credentials:</h4>
      <div className="text-xs text-blue-700 space-y-1">
        <p><strong>Admin:</strong> rifkiri@gmail.com / [use your Supabase password]</p>
        <p>Users created by admin can sign in with their email and temporary password</p>
      </div>
      <Button 
        onClick={checkPendingUsers}
        variant="outline"
        size="sm"
        className="mt-2 text-xs"
      >
        Debug: Check Pending Users
      </Button>
    </div>
  );
};
