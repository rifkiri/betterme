import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export const DemoCredentials = () => {
  const checkPendingUsers = async () => {
    console.log('Checking profiles table for pending users...');
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_status', 'pending');
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You need to be signed in as an admin to add users');
        return;
      }

      // Check if current user is admin
      const {
        data: profile
      } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') {
        toast.error('Only admins can add pending users');
        return;
      }

      // Check if user already exists
      const {
        data: existingUser
      } = await supabase.from('profiles').select('email').eq('email', 'alinne.rosida@gmail.com').single();
      if (existingUser) {
        toast.info('Test user already exists in profiles table');
        return;
      }
      const {
        data,
        error
      } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        name: 'Alinne Rosida',
        email: 'alinne.rosida@gmail.com',
        role: 'team-member',
        position: 'Test Position',
        temporary_password: 'temp123',
        user_status: 'pending',
        has_changed_password: false
      }).select();
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
  return;
};