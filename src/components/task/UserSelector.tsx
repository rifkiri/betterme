
import { useState } from 'react';
import { Check, X, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserSelector } from '@/hooks/useUserSelector';
import { 
  getSelectedUsersFromList, 
  toggleUserSelection, 
  removeUserFromSelection 
} from '@/utils/userSelectorUtils';

interface UserSelectorProps {
  selectedUserIds?: string[];
  onSelectionChange: (userIds: string[]) => void;
  currentUserId?: string;
}

export const UserSelector = ({ selectedUserIds, onSelectionChange, currentUserId }: UserSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  // Ensure selectedUserIds is always an array at the component level
  const safeSelectedUserIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];

  const { users, loading, error } = useUserSelector({ currentUserId });

  const toggleUser = (userId: string) => {
    const newSelection = toggleUserSelection(safeSelectedUserIds, userId);
    onSelectionChange(newSelection);
  };

  const removeUser = (userId: string) => {
    const newSelection = removeUserFromSelection(safeSelectedUserIds, userId);
    onSelectionChange(newSelection);
  };

  const selectedUsers = getSelectedUsersFromList(users, safeSelectedUserIds);

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
          <Command>
            <CommandInput placeholder="Search users..." />
            <ScrollArea className="h-[300px]">
              <CommandList className="max-h-none">
                <CommandEmpty>
                  {loading ? "Loading users..." : 
                   error ? error : 
                   users.length === 0 ? "No other users found (current user and admins are excluded)." : 
                   "No users found."}
                </CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.name || 'Unknown User'} ${user.email || ''}`}
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
            </ScrollArea>
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
