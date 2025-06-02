
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, Calendar, Settings, Users, LogOut } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AppNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [{
      name: 'My Productivity',
      href: '/',
      icon: Home,
      description: 'Daily productivity tracking'
    }, {
      name: 'My Progress',
      href: '/monthly',
      icon: Calendar,
      description: 'Monthly analytics'
    }];

    if (currentUser?.role === 'admin') {
      return [...baseItems, {
        name: 'My Team',
        href: '/manager',
        icon: Users,
        description: 'Team management'
      }, {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'App preferences'
      }];
    } else if (currentUser?.role === 'manager') {
      return [...baseItems, {
        name: 'My Team',
        href: '/manager',
        icon: Users,
        description: 'Team management'
      }];
    } else {
      // team-member gets only base items
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
          <div className="flex items-center space-x-4">
            <Link to="/profile" className="flex items-center">
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {currentUser?.name ? getUserInitials(currentUser.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
