
import { useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useUsersData } from './useUsersData';
import { useUserCrud } from './useUserCrud';

export const useUserManagement = () => {
  const { currentUser, isAdmin } = useCurrentUser();
  const { users, isLoading, loadUsers } = useUsersData();
  const { handleAddUser, handleDeleteUser, handleUpdateUser } = useUserCrud(isAdmin, loadUsers);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  return {
    users,
    isLoading,
    currentUser,
    isAdmin,
    loadUsers,
    handleAddUser,
    handleDeleteUser,
    handleUpdateUser
  };
};
