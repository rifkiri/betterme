
import { useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useAdminUsersData } from './useAdminUsersData';
import { useUserCrud } from './useUserCrud';

export const useUserManagement = () => {
  const { currentUser, isAdmin } = useCurrentUser();
  const { users, isLoading, loadUsers } = useAdminUsersData();
  const { handleAddUser, handleDeleteUser, handleUpdateUser, handleActivateUser } = useUserCrud(isAdmin, loadUsers);

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
    handleUpdateUser,
    handleActivateUser
  };
};
