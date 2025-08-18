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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Goal, WeeklyOutput } from '@/types/productivity';
import { getSubcategoryOptions, mapSubcategoryDisplayToDatabase, mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { itemLinkageService } from '@/services/ItemLinkageService';
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
  weeklyOutputs?: WeeklyOutput[];
}

export const EditGoalDialog = ({ goal, open, onOpenChange, onSave, weeklyOutputs = [] }: EditGoalDialogProps) => {
  const [selectedOutputs, setSelectedOutputs] = useState<WeeklyOutput[]>([]);
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);
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
    const fetchLinkedOutputs = async () => {
      if (currentUser?.id && open) {
        try {
          const linkedItems = await itemLinkageService.getLinkedItems('goal', goal.id, currentUser.id);
          const outputIds = linkedItems.filter(item => item.type === 'weekly_output').map(item => item.id);
          const linkedOutputs = weeklyOutputs.filter(output => outputIds.includes(output.id));
          setSelectedOutputs(linkedOutputs);
          form.setValue('selectedOutputIds', outputIds);
        } catch (error) {
          console.error('Error fetching linked outputs:', error);
        }
      }
    };

    if (open && goal) {
      fetchLinkedOutputs();
      form.reset({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        subcategory: goal.subcategory ? mapSubcategoryDatabaseToDisplay(goal.subcategory) : "none",
        deadline: goal.deadline,
      });
    }
  }, [goal, open, currentUser?.id, weeklyOutputs, form]);

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

    // Update output linkages
    if (currentUser?.id && data.selectedOutputIds) {
      try {
        await itemLinkageService.updateLinks('goal', goal.id, 'weekly_output', data.selectedOutputIds, currentUser.id);
      } catch (error) {
        console.error('Error updating output links:', error);
      }
    }
    
    onOpenChange(false);
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