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
import { CalendarIcon, X } from 'lucide-react';
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
      console.log('=== PERSONAL GOAL EDIT DIALOG INITIALIZING ===');
      console.log('Goal:', goal);
      console.log('Available habits:', habits.length);
      
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
    console.log('Loaded linked habits:', goalLinkedHabits.length);
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
            await supabaseWeeklyOutputsService.updateWeeklyOutput(outputId, currentUser.id, { linkedGoalId: undefined });
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
            await supabaseHabitsService.updateHabit(habitId, currentUser.id, { linkedGoalId: undefined });
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Link Weekly Outputs */}
              <div>
                <FormLabel className="text-sm font-medium">Link Weekly Outputs (Optional)</FormLabel>
                <div className="mt-2">
                  <Popover open={isOutputDropdownOpen} onOpenChange={setIsOutputDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        Link weekly outputs to this goal
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-background border shadow-md z-50">
                      <Command>
                        <CommandInput placeholder="Search outputs..." />
                        <CommandList>
                          <CommandEmpty>No outputs found.</CommandEmpty>
                          <CommandGroup>
                            {availableOutputs.length === 0 ? (
                              <CommandItem disabled>No weekly outputs available</CommandItem>
                            ) : (
                              availableOutputs.map((output) => (
                                <CommandItem
                                  key={output.id}
                                  onSelect={() => toggleOutputSelection(output)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2 w-full">
                                    <input
                                      type="checkbox"
                                      checked={(form.getValues('selectedOutputIds') || []).includes(output.id)}
                                      onChange={() => toggleOutputSelection(output)}
                                      className="rounded"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{output.title}</div>
                                      {output.description && (
                                        <div className="text-sm text-muted-foreground">{output.description}</div>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Selected Outputs */}
                  {selectedOutputs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedOutputs.map((output) => (
                        <Badge key={output.id} variant="secondary" className="flex items-center gap-1">
                          {output.title}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeOutput(output.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Link Habits - Always shown for personal goals */}
              <div>
                <FormLabel className="text-sm font-medium">Link Habits (Optional)</FormLabel>
                <div className="mt-2">
                  <Popover open={isHabitDropdownOpen} onOpenChange={setIsHabitDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        Link habits to this personal goal
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-background border shadow-md z-50">
                      <Command>
                        <CommandInput placeholder="Search habits..." />
                        <CommandList>
                          <CommandEmpty>No habits found.</CommandEmpty>
                          <CommandGroup>
                            {availableHabits.length === 0 ? (
                              <CommandItem disabled>No habits available to link</CommandItem>
                            ) : (
                              availableHabits.map((habit) => (
                                <CommandItem
                                  key={habit.id}
                                  onSelect={() => toggleHabitSelection(habit)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2 w-full">
                                    <input
                                      type="checkbox"
                                      checked={(form.getValues('selectedHabitIds') || []).includes(habit.id)}
                                      onChange={() => toggleHabitSelection(habit)}
                                      className="rounded"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{habit.name}</div>
                                      {habit.description && (
                                        <div className="text-sm text-muted-foreground">{habit.description}</div>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Selected Habits */}
                  {selectedHabits.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedHabits.map((habit) => (
                        <Badge key={habit.id} variant="secondary" className="flex items-center gap-1">
                          {habit.name}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeHabit(habit.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                <div className="flex justify-end space-x-2 pt-6 sticky bottom-0 bg-background border-t mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};