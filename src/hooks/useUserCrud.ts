
import { useUserActions } from './useUserActions';

export const useUserCrud = (isAdmin: boolean, loadUsers: () => Promise<void>) => {
  return useUserActions(isAdmin, loadUsers);
};
