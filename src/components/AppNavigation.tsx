import { Button } from '@/components/ui/button';
import { Home, Calendar, Settings, User, BarChart3, Users } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
export const AppNavigation = () => {
  const location = useLocation();
  const navigationItems = [{
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Daily productivity tracking'
  }, {
    name: 'Monthly',
    href: '/monthly',
    icon: Calendar,
    description: 'Monthly analytics'
  }, {
    name: 'Manager',
    href: '/manager',
    icon: Users,
    description: 'Team management'
  }, {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Detailed reports'
  }, {
    name: 'Profile',
    href: '/profile',
    icon: User,
    description: 'User settings'
  }, {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App preferences'
  }];
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