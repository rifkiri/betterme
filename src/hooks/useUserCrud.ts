
import { useUserActions } from './useUserActions';

export const useUserCrud = (isAdmin: boolean, loadUsers: () => Promise<void>) => {
  const userActions = useUserActions(isAdmin, loadUsers);
  return {
    ...userActions
  };
};
