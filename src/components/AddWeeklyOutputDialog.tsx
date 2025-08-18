
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, CalendarIcon, Link, ChevronDown, Target, User } from 'lucide-react';
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
  const [isGoalSectionOpen, setIsGoalSectionOpen] = useState(false);

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
    // Ensure the due date is set to end of day in local time to avoid timezone issues
    let dueDate = data.dueDate;
    if (dueDate) {
      dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    }

    onAddWeeklyOutput({
      title: data.title,
      description: data.description,
      progress: 0,
      dueDate: dueDate,
    }, data.selectedGoalIds || []);
    
    form.reset();
    setOpen(false);
  };

  // Get today's date and set time to start of day for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter active goals (not completed, not archived)
  const activeGoals = availableGoals.filter(goal => 
    !goal.completed && !goal.archived
  );

  // Separate work and personal goals
  const workGoals = activeGoals.filter(goal => goal.category === 'work');
  const personalGoals = activeGoals.filter(goal => goal.category === 'personal');

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
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="selectedGoalIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Link to Goals (Optional)
                      </FormLabel>
                      
                      {/* Work Goals */}
                      {workGoals.length > 0 && (
                        <Collapsible open={isGoalSectionOpen} onOpenChange={setIsGoalSectionOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between"
                              onClick={() => setIsGoalSectionOpen(!isGoalSectionOpen)}
                            >
                              <span className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
                                Work Goals ({workGoals.length})
                              </span>
                              <ChevronDown 
                                className={cn("h-4 w-4 transition-transform", 
                                  isGoalSectionOpen && "rotate-180"
                                )} 
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2 mt-2">
                            {workGoals.map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2 p-2 border rounded-lg bg-blue-50">
                                <Checkbox
                                  id={`goal-${goal.id}`}
                                  checked={field.value?.includes(goal.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentIds = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentIds, goal.id]);
                                    } else {
                                      field.onChange(currentIds.filter(id => id !== goal.id));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`goal-${goal.id}`} 
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                                      {goal.description && (
                                        <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                                        Work
                                      </Badge>
                                      <span className="text-xs text-gray-500">{goal.progress}%</span>
                                    </div>
                                  </div>
                                </label>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Personal Goals */}
                      {personalGoals.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Personal Goals ({personalGoals.length})
                          </div>
                          {personalGoals.map((goal) => (
                            <div key={goal.id} className="flex items-center space-x-2 p-2 border rounded-lg bg-green-50">
                              <Checkbox
                                id={`goal-${goal.id}`}
                                checked={field.value?.includes(goal.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentIds = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentIds, goal.id]);
                                  } else {
                                    field.onChange(currentIds.filter(id => id !== goal.id));
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`goal-${goal.id}`} 
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                                    {goal.description && (
                                      <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      Personal
                                    </Badge>
                                    <span className="text-xs text-gray-500">{goal.progress}%</span>
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selected Goals Summary */}
                      {field.value && field.value.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Selected Goals ({field.value.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {field.value.map((goalId) => {
                              const goal = activeGoals.find(g => g.id === goalId);
                              return goal ? (
                                <Badge 
                                  key={goalId} 
                                  variant="secondary" 
                                  className="text-xs bg-blue-100 text-blue-800"
                                >
                                  {goal.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-output-form">Add Output</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
