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
import { CalendarIcon, X, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Goal, WeeklyOutput, Habit } from '@/types/productivity';
import { getSubcategoryOptions, mapSubcategoryDisplayToDatabase, mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { supabaseWeeklyOutputsService } from '@/services/SupabaseWeeklyOutputsService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHabits } from '@/hooks/useHabits';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['personal']), // Only personal for this dialog
  subcategory: z.string().optional(),
  deadline: z.date().optional(),
  selectedOutputIds: z.array(z.string()).optional(),
  selectedHabitIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PersonalGoalEditDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Goal>) => void;
  onRefresh?: () => Promise<void>;
  weeklyOutputs?: WeeklyOutput[];
}

export const PersonalGoalEditDialog = ({ 
  goal, 
  open, 
  onOpenChange, 
  onSave, 
  onRefresh, 
  weeklyOutputs = [] 
}: PersonalGoalEditDialogProps) => {
  const [selectedOutputs, setSelectedOutputs] = useState<WeeklyOutput[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Habit[]>([]);
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);
  const [isHabitDropdownOpen, setIsHabitDropdownOpen] = useState(false);
  const { currentUser } = useCurrentUser();
  
  // Use the habits hook to get habits data directly
  const { habits } = useHabits();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      subcategory: 'none',
      deadline: undefined,
      selectedOutputIds: [],
      selectedHabitIds: [],
    },
  });

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && goal && goal.category === 'personal') {
      // Reset form with goal data
      form.reset({
        title: goal.title,
        description: goal.description || '',
        category: 'personal',
        subcategory: goal.subcategory ? mapSubcategoryDatabaseToDisplay(goal.subcategory) : "none",
        deadline: goal.deadline,
        selectedOutputIds: [],
        selectedHabitIds: [],
      });

      // Load linked items
      loadLinkedItems();
    }
  }, [goal, open, form, habits]);

  const loadLinkedItems = async () => {
    // Find outputs linked to this goal
    const goalLinkedOutputs = weeklyOutputs.filter(output => output.linkedGoalId === goal.id);
    setSelectedOutputs(goalLinkedOutputs);
    form.setValue('selectedOutputIds', goalLinkedOutputs.map(o => o.id));
    
    // Find habits linked to this goal
    const goalLinkedHabits = habits.filter(habit => habit.linkedGoalId === goal.id);
    setSelectedHabits(goalLinkedHabits);
    form.setValue('selectedHabitIds', goalLinkedHabits.map(h => h.id));
  };

  const onSubmit = async (data: FormData) => {
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

    // Update output linkages
    if (currentUser?.id && data.selectedOutputIds) {
      try {
        const outputsToLink = data.selectedOutputIds;
        const currentlyLinkedOutputs = weeklyOutputs.filter(output => output.linkedGoalId === goal.id).map(o => o.id);
        
        // Link new outputs
        for (const outputId of outputsToLink) {
          if (!currentlyLinkedOutputs.includes(outputId)) {
            const outputToUpdate = weeklyOutputs.find(o => o.id === outputId);
            if (outputToUpdate) {
              await supabaseWeeklyOutputsService.updateWeeklyOutput(outputId, currentUser.id, { linkedGoalId: goal.id });
            }
          }
        }
        
        // Unlink removed outputs
        for (const outputId of currentlyLinkedOutputs) {
          if (!outputsToLink.includes(outputId)) {
            await supabaseWeeklyOutputsService.updateWeeklyOutput(outputId, currentUser.id, { linkedGoalId: null });
          }
        }
      } catch (error) {
        console.error('Error updating output links:', error);
      }
    }

    // Update habit linkages
    if (currentUser?.id && data.selectedHabitIds) {
      try {
        const { supabaseHabitsService } = await import('@/services/SupabaseHabitsService');
        
        const habitsToLink = data.selectedHabitIds;
        const currentlyLinkedHabits = habits.filter(habit => habit.linkedGoalId === goal.id).map(h => h.id);
        
        // Link new habits
        for (const habitId of habitsToLink) {
          if (!currentlyLinkedHabits.includes(habitId)) {
            const habitToUpdate = habits.find(h => h.id === habitId);
            if (habitToUpdate) {
              await supabaseHabitsService.updateHabit(habitId, currentUser.id, { linkedGoalId: goal.id });
            }
          }
        }
        
        // Unlink removed habits
        for (const habitId of currentlyLinkedHabits) {
          if (!habitsToLink.includes(habitId)) {
            await supabaseHabitsService.updateHabit(habitId, currentUser.id, { linkedGoalId: null });
          }
        }
      } catch (error) {
        console.error('Error updating habit links:', error);
      }
    }
    
    onOpenChange(false);
    
    if (onRefresh) {
      await onRefresh();
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableOutputs = weeklyOutputs.filter(output => output.progress < 100);
  const availableHabits = habits.filter(habit => !habit.archived && !habit.isDeleted);

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

  const toggleHabitSelection = (habit: Habit) => {
    const currentIds = form.getValues('selectedHabitIds') || [];
    const isSelected = currentIds.includes(habit.id);
    
    if (isSelected) {
      const newIds = currentIds.filter(id => id !== habit.id);
      const newSelectedHabits = selectedHabits.filter(h => h.id !== habit.id);
      setSelectedHabits(newSelectedHabits);
      form.setValue('selectedHabitIds', newIds);
    } else {
      const newIds = [...currentIds, habit.id];
      const newSelectedHabits = [...selectedHabits, habit];
      setSelectedHabits(newSelectedHabits);
      form.setValue('selectedHabitIds', newIds);
    }
  };

  const removeHabit = (habitId: string) => {
    const currentIds = form.getValues('selectedHabitIds') || [];
    const newIds = currentIds.filter(id => id !== habitId);
    const newSelectedHabits = selectedHabits.filter(h => h.id !== habitId);
    setSelectedHabits(newSelectedHabits);
    form.setValue('selectedHabitIds', newIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle>Edit Personal Goal</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-1 space-y-6">
            <Form {...form}>
              <form id="personal-goal-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Exercise daily for 30 days" {...field} />
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
                          placeholder="Optional description of your personal goal" 
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {getSubcategoryOptions('personal').map((subcategory) => (
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
                            onSelect={field.onChange}
                            disabled={(date) => date < today}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              {/* Link Weekly Outputs */}
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
                      <PopoverContent className="w-full p-0 bg-background border z-50" align="start">
                        <Command className="bg-background">
                          <CommandInput placeholder="Search outputs..." className="bg-background" />
                          <CommandList className="bg-background">
                            <CommandEmpty>No outputs found.</CommandEmpty>
                            <CommandGroup className="bg-background">
                              {availableOutputs.length === 0 ? (
                                <CommandItem disabled className="p-3">No weekly outputs available</CommandItem>
                              ) : (
                                availableOutputs.map((output) => (
                                  <CommandItem
                                    key={output.id}
                                    onSelect={() => toggleOutputSelection(output)}
                                    className="flex items-center justify-between p-3 bg-background hover:bg-accent cursor-pointer"
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
                                      {(form.getValues('selectedOutputIds') || []).includes(output.id) && (
                                        <div className="h-4 w-4 bg-primary rounded-sm flex items-center justify-center">
                                          <span className="text-xs text-primary-foreground">✓</span>
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

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

              {/* Link Habits */}
              <FormField
                control={form.control}
                name="selectedHabitIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Link to Habits (Optional)
                    </FormLabel>
                    
                    <Popover open={isHabitDropdownOpen} onOpenChange={setIsHabitDropdownOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {availableHabits.length === 0 
                              ? "No habits available to link" 
                              : selectedHabits.length === 0 
                                ? "Select habits to link..." 
                                : `${selectedHabits.length} habit${selectedHabits.length !== 1 ? 's' : ''} selected`
                            }
                            <Target className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background border z-50" align="start">
                        <Command className="bg-background">
                          <CommandInput placeholder="Search habits..." className="bg-background" />
                          <CommandList className="bg-background">
                            {availableHabits.length === 0 ? (
                              <CommandEmpty>No habits available. Create some habits first!</CommandEmpty>
                            ) : (
                              <>
                                <CommandEmpty>No habits found.</CommandEmpty>
                                <CommandGroup className="bg-background">
                                  {availableHabits.map((habit) => (
                                    <CommandItem
                                      key={habit.id}
                                      onSelect={() => toggleHabitSelection(habit)}
                                      className="flex items-center justify-between p-3 bg-background hover:bg-accent cursor-pointer"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-sm">{habit.name}</span>
                                          {habit.streak > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                              {habit.streak} day streak
                                            </Badge>
                                          )}
                                        </div>
                                        {habit.description && (
                                          <p className="text-xs text-muted-foreground">{habit.description}</p>
                                        )}
                                        {habit.category && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-muted-foreground">
                                              Category: {habit.category}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-2">
                                        {(form.getValues('selectedHabitIds') || []).includes(habit.id) && (
                                          <div className="h-4 w-4 bg-primary rounded-sm flex items-center justify-center">
                                            <span className="text-xs text-primary-foreground">✓</span>
                                          </div>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {selectedHabits.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Selected Habits ({selectedHabits.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedHabits.map((habit) => (
                            <Badge 
                              key={habit.id} 
                              variant="secondary" 
                              className="flex items-center gap-1"
                            >
                              {habit.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeHabit(habit.id);
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
              </form>
            </Form>
          </div>
        </ScrollArea>
        
        {/* Action buttons outside scrollable area */}
        <div className="shrink-0 border-t bg-background p-4">
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="personal-goal-form">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};