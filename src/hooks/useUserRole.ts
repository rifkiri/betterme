import { useCurrentUser } from './useCurrentUser';

export const useUserRole = () => {
  const { currentUser } = useCurrentUser();
  
  return {
    role: currentUser?.role,
    isTeamMember: currentUser?.role === 'team-member',
    isManager: currentUser?.role === 'manager',
    isAdmin: currentUser?.role === 'admin',
    isManagerOrAdmin: currentUser?.role === 'manager' || currentUser?.role === 'admin'
  };
};