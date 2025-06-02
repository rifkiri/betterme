
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DemoCredentials = () => {
  const checkPendingUsers = async () => {
    console.log('Checking pending users table...');
    try {
      const { data, error } = await supabase
        .from('pending_users')
        .select('*');
      
      console.log('Pending users data:', data);
      console.log('Pending users error:', error);
      
      if (error) {
        toast.error('Error checking pending users: ' + error.message);
      } else {
        toast.success(`Found ${data?.length || 0} pending users`);
        console.log('Pending users details:', data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error occurred');
    }
  };

  const addTestPendingUser = async () => {
    console.log('Adding test pending user...');
    try {
      // First check if user is admin by trying to sign in as admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You need to be signed in as an admin to add users');
        return;
      }

      // Check if current user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        toast.error('Only admins can add pending users');
        return;
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('pending_users')
        .select('email')
        .eq('email', 'alinne.rosida@gmail.com')
        .single();

      if (existingUser) {
        toast.info('Test user already exists in pending users table');
        return;
      }

      const { data, error } = await supabase
        .from('pending_users')
        .insert({
          name: 'Alinne Rosida',
          email: 'alinne.rosida@gmail.com',
          role: 'team-member',
          position: 'Test Position',
          temporary_password: 'temp123'
        })
        .select();
      
      console.log('Insert result:', data, error);
      
      if (error) {
        toast.error('Error adding test user: ' + error.message);
      } else {
        toast.success('Test user added successfully');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error occurred');
    }
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-sm text-blue-900 mb-2">Demo Credentials:</h4>
      <div className="text-xs text-blue-700 space-y-1">
        <p><strong>Admin:</strong> rifkiri@gmail.com / [use your Supabase password]</p>
        <p>Users created by admin can sign in with their email and temporary password</p>
        <p><strong>Test User:</strong> alinne.rosida@gmail.com / temp123 (after adding)</p>
      </div>
      <div className="flex gap-2 mt-2">
        <Button 
          onClick={checkPendingUsers}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Debug: Check Pending Users
        </Button>
        <Button 
          onClick={addTestPendingUser}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Add Test User
        </Button>
      </div>
    </div>
  );
};
