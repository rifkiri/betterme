
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, Calendar, Settings, Users, LogOut, Menu, X } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AppNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
    }, {
      name: 'Our Team',
      href: '/team',
      icon: Users,
      description: 'Team overview'
    }];

    if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
      baseItems.push({
        name: 'Manager Dashboard',
        href: '/manager',
        icon: Settings,
        description: 'Team workload and goal management'
      });
    }

    if (currentUser?.role === 'admin') {
      return [...baseItems, {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'App preferences'
      }];
    } else {
      return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">BetterMe</h1>
              </div>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                {navigationItems.map(item => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link 
                      key={item.name} 
                      to={item.href} 
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive 
                          ? 'text-blue-600 border-b-2 border-blue-600' 
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* User Avatar */}
              <Link to="/profile" className="flex items-center">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                    {currentUser?.name ? getUserInitials(currentUser.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              {/* Desktop Sign Out Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="hidden md:flex text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMobileMenu} />
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="sm" onClick={closeMobileMenu}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4">
              <div className="space-y-2">
                {navigationItems.map(item => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleSignOut();
                    closeMobileMenu();
                  }}
                  className="flex items-center w-full justify-start px-3 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
