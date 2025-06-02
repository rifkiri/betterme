
export const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/settings';
    case 'manager':
      return '/manager';
    default:
      return '/';
  }
};
