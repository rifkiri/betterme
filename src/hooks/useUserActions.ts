
import { toast } from 'sonner';
import { User } from '@/types/userTypes';
import { UserCrudService } from '@/services/UserCrudService';
import { useUserValidation } from './useUserValidation';

export const useUserActions = (isAdmin: boolean, loadUsers: () => Promise<void>) => {
  const { validateNewUser } = useUserValidation();

  const handleAddUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    if (!isAdmin) {
      toast.error('Only admins can add users');
      return;
    }

    try {
      const sanitizedUser = validateNewUser(newUser);
      await UserCrudService.createUser(sanitizedUser);
      await loadUsers();
      toast.success('User created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add user';
      toast.error(errorMessage);
      console.error('Failed to add user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    try {
      await UserCrudService.deleteUser(userId);
      toast.success('User deleted successfully from both profile and authentication system');
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
      console.error('Failed to delete user:', error);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    if (!isAdmin) {
      toast.error('Only admins can update users');
      return;
    }

    try {
      console.log('=== UPDATE USER DEBUG ===');
      console.log('User ID:', userId);
      console.log('Updates:', updates);

      // If updating email, sync with auth system
      if (updates.email) {
        await UserCrudService.updateUserEmail(userId, updates.email);
      }

      // If updating with a new password, reset the password in auth system
      if (updates.temporaryPassword) {
        await UserCrudService.updateUserPassword(userId, updates.temporaryPassword);
        
        // Clear temporary password and mark as pending for password change
        updates.hasChangedPassword = false;
        updates.userStatus = 'pending';
        updates.temporaryPassword = undefined; // Clear from profile after setting in auth
      }

      // Update profile data
      await UserCrudService.updateUserProfile(userId, updates);
      await loadUsers();
      
      if (updates.temporaryPassword) {
        toast.success('User updated and password reset in authentication system');
      } else if (updates.email) {
        toast.success('User updated and email synced with authentication system');
      } else {
        toast.success('User updated successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
      console.error('Failed to update user:', error);
    }
  };

  return {
    handleAddUser,
    handleDeleteUser,
    handleUpdateUser
  };
};
