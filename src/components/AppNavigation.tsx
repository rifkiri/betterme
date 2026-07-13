import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Calendar,
  Settings as SettingsIcon,
  Users,
  LogOut,
  Menu,
  X,
  Target,
  Bell,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> };

export const AppNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { signOut } = useUserProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  useEffect(() => {
    if (!currentUser?.id) return;
    const load = async () => {
      const [{ count: goalCount }, { count: taskCount }] = await Promise.all([
        supabase
          .from('goal_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('acknowledged', false),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('task_invitations')
          .select('id', { count: 'exact', head: true })
          .eq('invitee_id', currentUser.id)
          .eq('status', 'pending'),
      ]);
      setPendingCount((goalCount || 0) + (taskCount || 0));
    };
    load();
    const goalChannel = supabase
      .channel('nav-invitations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goal_assignments', filter: `user_id=eq.${currentUser.id}` },
        load
      )
      .subscribe();
    const taskChannel = supabase
      .channel('nav-task-invitations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_invitations', filter: `invitee_id=eq.${currentUser.id}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(goalChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [currentUser?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const getUserInitials = (name: string) =>
    name.split(' ').map((w) => w.charAt(0)).join('').toUpperCase().substring(0, 2);

  const navItems: NavItem[] = [
    { name: 'Productivity', href: '/', icon: Home },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Progress', href: '/monthly', icon: Calendar },
    { name: 'Team', href: '/team', icon: Users },
  ];
  if (isPrivileged) {
    navItems.push({ name: 'Organization', href: '/manager', icon: Building2 });
    navItems.push({ name: 'Settings', href: '/settings', icon: SettingsIcon });
  }

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center shrink-0" aria-label="BetterMe">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                BetterMe
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="relative inline-flex items-center p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/40 hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-sm font-semibold">
                          {currentUser?.name ? getUserInitials(currentUser.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium truncate">{currentUser?.name || 'You'}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser?.email || ''}</p>
                        {currentUser?.role && (
                          <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mt-1">
                            {currentUser.role}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {!isPrivileged && (
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer">
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                BetterMe
              </span>
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium truncate">{currentUser?.name || 'You'}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email || ''}</p>
            </div>
            <nav className="p-3 flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/profile') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <UserIcon className="h-5 w-5 mr-3" />
                Profile
              </Link>
              {!isPrivileged && (
                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/settings') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <SettingsIcon className="h-5 w-5 mr-3" />
                  Settings
                </Link>
              )}
            </nav>
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
