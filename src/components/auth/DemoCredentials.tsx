
import React from 'react';

export const DemoCredentials = () => {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-sm text-blue-900 mb-2">Demo Credentials:</h4>
      <div className="text-xs text-blue-700 space-y-1">
        <p><strong>Admin:</strong> rifkiri@gmail.com / [use your Supabase password]</p>
        <p>Users created by admin can sign in with their email and temporary password</p>
      </div>
    </div>
  );
};
