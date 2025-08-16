
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const filterUsersForTagging = (users: User[], currentUserId?: string): User[] => {
  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];
  
  return safeUsers.filter(user => {
    // Filter out current user if provided
    if (currentUserId && user.id === currentUserId) {
      return false;
    }
    // Admin users are already filtered out at the database level
    // No need to filter them here as they won't be in the list for non-admins
    return true;
  });
};

export const getSelectedUsersFromList = (users: User[], selectedUserIds: string[]): User[] => {
  const safeUsers = Array.isArray(users) ? users : [];
  const safeSelectedUserIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];
  
  return safeUsers.filter(user => safeSelectedUserIds.includes(user.id));
};

export const toggleUserSelection = (selectedUserIds: string[], userId: string): string[] => {
  const safeSelectedUserIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];
  
  return safeSelectedUserIds.includes(userId)
    ? safeSelectedUserIds.filter(id => id !== userId)
    : [...safeSelectedUserIds, userId];
};

export const removeUserFromSelection = (selectedUserIds: string[], userId: string): string[] => {
  const safeSelectedUserIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];
  return safeSelectedUserIds.filter(id => id !== userId);
};
