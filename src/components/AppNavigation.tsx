
import { Button } from '@/components/ui/button';
import { Home, Calendar, Settings, Users, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

// Mock function to get current user role (replace with real authentication)
const getCurrentUserRole = () => {
  const authUser = localStorage.getItem('authUser');
  if (authUser) {
    return JSON.parse(authUser).role;
  }
  return 'team-member';
};

export const AppNavigation = () => {
  const location = useLocation();
  const userRole = getCurrentUserRole();

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [{
      name: 'My Productivity',
      href: '/',
      icon: Home,
      description: 'Daily productivity tracking'
    }, {
      name: 'Dashboard',
      href: '/monthly',
      icon: Calendar,
      description: 'Monthly analytics'
    }, {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'User profile and preferences'
    }];

    if (userRole === 'admin') {
      return [...baseItems, {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'App preferences'
      }];
    } else if (userRole === 'manager') {
      return [...baseItems, {
        name: 'My Team',
        href: '/manager',
        icon: Users,
        description: 'Team management'
      }];
    } else {
      // team-member gets all base items
      return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">BetterMe</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map(item => {
              const isActive = location.pathname === item.href;
              return <Link key={item.name} to={item.href} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>;
            })}
            </nav>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
