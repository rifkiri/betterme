
import { useState, useEffect } from 'react';
import { Check, X, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSelectorProps {
  selectedUserIds?: string[];
  onSelectionChange: (userIds: string[]) => void;
  currentUserId?: string;
}

export const UserSelector = ({ selectedUserIds, onSelectionChange, currentUserId }: UserSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure selectedUserIds is always an array at the component level
  const safeSelectedUserIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users for tagging...');
      
      // First try to get current user to check if we have access
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('user_status', 'active');

      console.log('Profiles query result:', { data, error });

      if (error) {
        console.error('Error fetching users:', error);
        setError(`Failed to load users: ${error.message}`);
        setUsers([]); // Ensure users is always an array
        return;
      }

      // Ensure data is an array and filter out current user if provided
      const safeData = Array.isArray(data) ? data : [];
      const filteredUsers = currentUserId ? 
        safeData.filter(user => user.id !== currentUserId) : 
        safeData;
      
      console.log('Filtered users:', filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelection = safeSelectedUserIds.includes(userId)
      ? safeSelectedUserIds.filter(id => id !== userId)
      : [...safeSelectedUserIds, userId];
    
    console.log('User selection changed:', newSelection);
    onSelectionChange(newSelection);
  };

  const removeUser = (userId: string) => {
    const newSelection = safeSelectedUserIds.filter(id => id !== userId);
    console.log('User removed:', userId, 'New selection:', newSelection);
    onSelectionChange(newSelection);
  };

  // Ensure arrays are always defined
  const safeUsers = Array.isArray(users) ? users : [];
  const selectedUsers = safeUsers.filter(user => safeSelectedUserIds.includes(user.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {safeSelectedUserIds.length === 0 
                ? "Tag users for support..." 
                : `${safeSelectedUserIds.length} user${safeSelectedUserIds.length > 1 ? 's' : ''} tagged`
              }
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading users..." : 
                 error ? error : 
                 safeUsers.length === 0 ? "No other users found. Make sure other users are registered in the system." : 
                 "No users found."}
              </CommandEmpty>
              <CommandGroup>
                {safeUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name || 'Unknown User'}
                    onSelect={() => toggleUser(user.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        safeSelectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name || 'Unknown User'}</span>
                      <span className="text-sm text-gray-500">{user.email || ''}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {user.name || 'Unknown User'}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeUser(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mt-2">
          {error}
        </p>
      )}
    </div>
  );
};
