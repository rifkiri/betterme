import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { CalendarIcon, Users, UserCog, User } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Goal, WeeklyOutput, Habit, GoalAssignment } from '@/types/productivity';
import { getSubcategoryOptions, mapSubcategoryDisplayToDatabase, mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { supabaseWeeklyOutputsService } from '@/services/SupabaseWeeklyOutputsService';
import { supabaseGoalAssignmentsService } from '@/services/SupabaseGoalAssignmentsService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Target, X } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['work', 'personal']),
  subcategory: z.string().optional(),
  deadline: z.date().optional(),
  selectedOutputIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Goal>) => void;
  onRefresh?: () => Promise<void>;
  weeklyOutputs?: WeeklyOutput[];
  habits?: Habit[];
  assignments?: GoalAssignment[];
  availableUsers?: any[];
}

export const EditGoalDialog = ({ goal, open, onOpenChange, onSave, onRefresh, weeklyOutputs = [], habits = [], assignments = [], availableUsers = [] }: EditGoalDialogProps) => {
  const [selectedOutputs, setSelectedOutputs] = useState<WeeklyOutput[]>([]);
  const [linkedHabits, setLinkedHabits] = useState<Habit[]>([]);
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);
  const [goalAssignments, setGoalAssignments] = useState<GoalAssignment[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { currentUser } = useCurrentUser();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      subcategory: goal.subcategory ? mapSubcategoryDatabaseToDisplay(goal.subcategory) : "none",
      deadline: goal.deadline,
      selectedOutputIds: [],
    },
  });

  useEffect(() => {
    const fetchLinkedItems = async () => {
      if (open) {
        // Find outputs linked to this goal using the restored linkedGoalId field
        const goalLinkedOutputs = weeklyOutputs.filter(output => output.linkedGoalId === goal.id);
        setSelectedOutputs(goalLinkedOutputs);
        form.setValue('selectedOutputIds', goalLinkedOutputs.map(o => o.id));
        
        // For habits on personal goals, we'll skip this for now to simplify
        // This focuses on fixing the weekly output linking issue first
        setLinkedHabits([]);

        // Load goal assignments for work goals
        if (goal.category === 'work') {
          try {
            const workGoalAssignments = await supabaseGoalAssignmentsService.getAssignmentsForGoal(goal.id);
            setGoalAssignments(workGoalAssignments);
            
            // Set selected roles based on current assignments
            const coach = workGoalAssignments.find(a => a.role === 'coach');
            const lead = workGoalAssignments.find(a => a.role === 'lead');
            const members = workGoalAssignments.filter(a => a.role === 'member');
            
            setSelectedCoach(coach?.userId || '');
            setSelectedLead(lead?.userId || '');
            setSelectedMembers(members.map(m => m.userId));
          } catch (error) {
            console.error('Error loading goal assignments:', error);
          }
        }
      }
    };

    if (open && goal) {
      fetchLinkedItems();
      form.reset({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        subcategory: goal.subcategory ? mapSubcategoryDatabaseToDisplay(goal.subcategory) : "none",
        deadline: goal.deadline,
      });
    }
  }, [goal, open, currentUser?.id, weeklyOutputs, habits, form]);

  const onSubmit = async (data: FormData) => {
    // Ensure the due date is set to end of day in local time to avoid timezone issues
    let deadline = data.deadline;
    if (deadline) {
      deadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
    }

    // Save the goal updates
    onSave(goal.id, {
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory === "none" ? undefined : mapSubcategoryDisplayToDatabase(data.subcategory),
      deadline: deadline,
    });

    // Update output linkages using the restored linkedGoalId approach
    if (currentUser?.id && data.selectedOutputIds) {
      try {
        // Find outputs that should be linked to this goal
        const outputsToLink = data.selectedOutputIds;
        const currentlyLinkedOutputs = weeklyOutputs.filter(output => output.linkedGoalId === goal.id).map(o => o.id);
        
        // Update outputs that need to be linked
        for (const outputId of outputsToLink) {
          if (!currentlyLinkedOutputs.includes(outputId)) {
            // Link this output to the goal by updating its linkedGoalId
            const outputToUpdate = weeklyOutputs.find(o => o.id === outputId);
            if (outputToUpdate) {
              await supabaseWeeklyOutputsService.updateWeeklyOutput(outputId, currentUser.id, { linkedGoalId: goal.id });
            }
          }
        }
        
        // Update outputs that need to be unlinked
        for (const outputId of currentlyLinkedOutputs) {
          if (!outputsToLink.includes(outputId)) {
            // Unlink this output from the goal
            await supabaseWeeklyOutputsService.updateWeeklyOutput(outputId, currentUser.id, { linkedGoalId: undefined });
          }
        }
      } catch (error) {
        console.error('Error updating output links:', error);
      }
    }

    // Update role assignments for work goals
    if (goal.category === 'work' && currentUser?.id) {
      try {
        // Get current assignments
        const currentAssignments = await supabaseGoalAssignmentsService.getAssignmentsForGoal(goal.id);
        
        // Create new assignments structure
        const newAssignments: { userId: string; role: 'coach' | 'lead' | 'member' }[] = [];
        
        if (selectedCoach) {
          newAssignments.push({ userId: selectedCoach, role: 'coach' });
        }
        if (selectedLead) {
          newAssignments.push({ userId: selectedLead, role: 'lead' });
        }
        selectedMembers.forEach(memberId => {
          newAssignments.push({ userId: memberId, role: 'member' });
        });

        // Delete assignments that no longer exist
        for (const currentAssignment of currentAssignments) {
          const stillExists = newAssignments.some(
            na => na.userId === currentAssignment.userId && na.role === currentAssignment.role
          );
          if (!stillExists) {
            await supabaseGoalAssignmentsService.deleteGoalAssignment(currentAssignment.id);
          }
        }

        // Add new assignments
        for (const newAssignment of newAssignments) {
          const alreadyExists = currentAssignments.some(
            ca => ca.userId === newAssignment.userId && ca.role === newAssignment.role
          );
          if (!alreadyExists) {
            await supabaseGoalAssignmentsService.createGoalAssignment({
              goalId: goal.id,
              userId: newAssignment.userId,
              role: newAssignment.role,
              assignedBy: currentUser.id,
              acknowledged: false,
              selfAssigned: false
            });
          }
        }
      } catch (error) {
        console.error('Error updating role assignments:', error);
      }
    }
    
    onOpenChange(false);
    
    // Trigger data refresh to ensure bidirectional updates appear
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Get today's date and set time to start of day for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter available outputs (not completed)
  const availableOutputs = weeklyOutputs.filter(output => output.progress < 100);

  const toggleOutputSelection = (output: WeeklyOutput) => {
    const currentIds = form.getValues('selectedOutputIds') || [];
    const isSelected = currentIds.includes(output.id);
    
    if (isSelected) {
      const newIds = currentIds.filter(id => id !== output.id);
      const newSelectedOutputs = selectedOutputs.filter(o => o.id !== output.id);
      setSelectedOutputs(newSelectedOutputs);
      form.setValue('selectedOutputIds', newIds);
    } else {
      const newIds = [...currentIds, output.id];
      const newSelectedOutputs = [...selectedOutputs, output];
      setSelectedOutputs(newSelectedOutputs);
      form.setValue('selectedOutputIds', newIds);
    }
  };

  const removeOutput = (outputId: string) => {
    const currentIds = form.getValues('selectedOutputIds') || [];
    const newIds = currentIds.filter(id => id !== outputId);
    const newSelectedOutputs = selectedOutputs.filter(o => o.id !== outputId);
    setSelectedOutputs(newSelectedOutputs);
    form.setValue('selectedOutputIds', newIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Complete 10 tasks this week" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description of your goal" 
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}
            />

            {/* Subcategory Field */}
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No subcategory</SelectItem>
                      {getSubcategoryOptions(form.watch('category')).map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a deadline</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Create date in local timezone to avoid timezone conversion issues
                            const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                            field.onChange(localDate);
                          } else {
                            field.onChange(date);
                          }
                        }}
                        disabled={(date) => {
                          const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                          return dateToCheck < today;
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Output Linking Section */}
            {availableOutputs.length > 0 && (
              <FormField
                control={form.control}
                name="selectedOutputIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Link to Weekly Outputs (Optional)
                    </FormLabel>
                    
                    <Popover open={isOutputDropdownOpen} onOpenChange={setIsOutputDropdownOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedOutputs.length === 0 
                              ? "Select outputs to link..." 
                              : `${selectedOutputs.length} output${selectedOutputs.length !== 1 ? 's' : ''} selected`
                            }
                            <Target className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search outputs..." />
                          <CommandList>
                            <CommandEmpty>No outputs found.</CommandEmpty>
                            <CommandGroup>
                              {availableOutputs.map((output) => (
                                <CommandItem
                                  key={output.id}
                                  onSelect={() => toggleOutputSelection(output)}
                                  className="flex items-center justify-between p-3"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">{output.title}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {output.progress}%
                                      </Badge>
                                    </div>
                                    {output.description && (
                                      <p className="text-xs text-muted-foreground">{output.description}</p>
                                    )}
                                    {output.dueDate && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                          Due: {format(output.dueDate, 'MMM dd')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    {(field.value || []).includes(output.id) && (
                                      <div className="h-4 w-4 bg-primary rounded-sm flex items-center justify-center">
                                        <span className="text-xs text-primary-foreground">✓</span>
                                      </div>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Outputs Display */}
                    {selectedOutputs.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Selected Outputs ({selectedOutputs.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedOutputs.map((output) => (
                            <Badge 
                              key={output.id} 
                              variant="secondary" 
                              className="flex items-center gap-1"
                            >
                              {output.title}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeOutput(output.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Work Goal Role Assignments - only show for work goals */}
            {form.watch('category') === 'work' && availableUsers.length > 0 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Role Assignments
                </h3>
                
                {/* Coach Selection */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Coach (Optional)</span>
                  </div>
                  <Select value={selectedCoach} onValueChange={(value) => setSelectedCoach(value === 'none' ? '' : value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a coach (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="none">No coach assigned</SelectItem>
                      {availableUsers
                        .filter(user => user.role === 'manager' || user.role === 'admin' || user.role === 'team-member')
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lead Selection */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Lead (Optional)</span>
                  </div>
                  <Select value={selectedLead} onValueChange={(value) => setSelectedLead(value === 'none' ? '' : value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a lead (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="none">No lead assigned</SelectItem>
                      {availableUsers
                        .filter(user => user.role === 'manager' || user.role === 'admin' || user.role === 'team-member')
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Members Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Members</span>
                  </div>
                  <div className="space-y-2">
                    {availableUsers
                      .filter(user => user.role === 'team-member' || user.role === 'manager')
                      .map(user => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`member-${user.id}`}
                            checked={selectedMembers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers([...selectedMembers, user.id]);
                              } else {
                                setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`member-${user.id}`} className="text-sm">
                            {user.name} ({user.role})
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Current Linked Items Display */}
            {(selectedOutputs.length > 0 || linkedHabits.length > 0) && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700 border-t pt-4">
                  Current Linked Items
                </div>
                
                {/* Current Linked Outputs */}
                {selectedOutputs.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Linked Outputs ({selectedOutputs.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedOutputs.map((output) => (
                        <Badge key={output.id} variant="secondary" className="text-xs">
                          {output.title} ({output.progress}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Linked Habits (Personal Goals Only) */}
                {goal.category === 'personal' && linkedHabits.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Linked Habits ({linkedHabits.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {linkedHabits.map((habit) => (
                        <Badge key={habit.id} variant="outline" className="text-xs">
                          {habit.name} 
                          {habit.streak > 0 && (
                            <span className="ml-1 text-green-600">
                              ({habit.streak} streak)
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};