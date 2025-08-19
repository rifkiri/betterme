
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, CalendarIcon, Target, X } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { WeeklyOutput, Goal } from '@/types/productivity';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  selectedGoalIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddWeeklyOutputDialogProps {
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>, selectedGoalIds?: string[]) => void;
  availableGoals?: Goal[];
}

export const AddWeeklyOutputDialog = ({ onAddWeeklyOutput, availableGoals = [] }: AddWeeklyOutputDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: undefined,
      selectedGoalIds: [],
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('🔥 [AddDialog] Form submitted!');
    console.log('🔥 [AddDialog] Form data:', data);
    
    // Ensure the due date is set to end of day in local time to avoid timezone issues
    let dueDate = data.dueDate;
    if (dueDate) {
      dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    }

    console.log('🔥 [AddDialog] Submitting with selected goal IDs:', data.selectedGoalIds);
    console.log('🔥 [AddDialog] onAddWeeklyOutput callback exists:', typeof onAddWeeklyOutput);

    onAddWeeklyOutput({
      title: data.title,
      description: data.description,
      progress: 0,
      dueDate: dueDate,
    }, data.selectedGoalIds || []);
    
    form.reset();
    setSelectedGoals([]);
    setOpen(false);
  };

  // Get today's date and set time to start of day for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter active goals (not completed, not archived)
  const activeGoals = availableGoals.filter(goal => 
    !goal.completed && !goal.archived
  );

  const toggleGoalSelection = (goal: Goal) => {
    const currentIds = form.getValues('selectedGoalIds') || [];
    const isSelected = currentIds.includes(goal.id);
    
    if (isSelected) {
      const newIds = currentIds.filter(id => id !== goal.id);
      const newSelectedGoals = selectedGoals.filter(g => g.id !== goal.id);
      setSelectedGoals(newSelectedGoals);
      form.setValue('selectedGoalIds', newIds);
    } else {
      const newIds = [...currentIds, goal.id];
      const newSelectedGoals = [...selectedGoals, goal];
      setSelectedGoals(newSelectedGoals);
      form.setValue('selectedGoalIds', newIds);
    }
  };

  const removeGoal = (goalId: string) => {
    const currentIds = form.getValues('selectedGoalIds') || [];
    const newIds = currentIds.filter(id => id !== goalId);
    const newSelectedGoals = selectedGoals.filter(g => g.id !== goalId);
    setSelectedGoals(newSelectedGoals);
    form.setValue('selectedGoalIds', newIds);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Outputs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add Weekly Output</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-1">
          <Form {...form}>
            <form id="add-output-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter output title..." {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
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
                            <span>Pick a due date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50" align="start">
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

            {/* Link to Goals */}
            {activeGoals.length > 0 && (
              <FormField
                control={form.control}
                name="selectedGoalIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Link to Goals (Optional)
                    </FormLabel>
                    
                    <Popover open={isGoalDropdownOpen} onOpenChange={setIsGoalDropdownOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedGoals.length === 0 
                              ? "Select goals to link..." 
                              : `${selectedGoals.length} goal${selectedGoals.length !== 1 ? 's' : ''} selected`
                            }
                            <Target className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background border border-border shadow-lg z-50" align="start">
                        <Command>
                          <CommandInput placeholder="Search goals..." />
                          <CommandList>
                            <CommandEmpty>No goals found.</CommandEmpty>
                            <CommandGroup>
                              {activeGoals.map((goal) => (
                                <CommandItem
                                  key={goal.id}
                                  onSelect={() => toggleGoalSelection(goal)}
                                  className="flex items-center justify-between p-3"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">{goal.title}</span>
                                      <Badge 
                                        className={`text-xs ${
                                          goal.category === 'work' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-green-100 text-green-800'
                                        }`}
                                      >
                                        {goal.category}
                                      </Badge>
                                    </div>
                                    {goal.description && (
                                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">Progress: {goal.progress}%</span>
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    {(field.value || []).includes(goal.id) && (
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

                    {/* Selected Goals Display */}
                    {selectedGoals.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Selected Goals ({selectedGoals.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedGoals.map((goal) => (
                            <Badge 
                              key={goal.id} 
                              variant="secondary" 
                              className="flex items-center gap-1"
                            >
                              {goal.title}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeGoal(goal.id);
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
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-output-form" onClick={() => console.log('🔥 [AddDialog] Submit button clicked!')}>Add Output</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
