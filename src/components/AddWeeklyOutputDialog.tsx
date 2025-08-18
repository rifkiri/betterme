
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
  linkedGoalIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddWeeklyOutputDialogProps {
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => void;
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
      linkedGoalIds: [],
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
      linkedGoalIds: data.linkedGoalIds || [],
    });
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

            {/* Goal Linking Section */}
            {activeGoals.length > 0 && (
              <FormField
                control={form.control}
                name="linkedGoalIds"
                render={({ field }) => (
                  <FormItem>
                    <Collapsible open={isGoalSectionOpen} onOpenChange={setIsGoalSectionOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            <span>Link to Goals ({field.value?.length || 0} selected)</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isGoalSectionOpen && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        {/* Work Goals */}
                        {workGoals.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Work Goals</span>
                              <Badge variant="secondary" className="text-xs">{workGoals.length}</Badge>
                            </div>
                            <div className="space-y-2 pl-6">
                              {workGoals.map((goal) => (
                                <div key={goal.id} className="flex items-start space-x-2">
                                  <Checkbox
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
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{goal.title}</p>
                                    {goal.description && (
                                      <p className="text-xs text-muted-foreground truncate">{goal.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {goal.progress}%
                                      </Badge>
                                      {goal.deadline && (
                                        <span className="text-xs text-muted-foreground">
                                          Due {format(goal.deadline, 'MMM dd')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Personal Goals */}
                        {personalGoals.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Personal Goals</span>
                              <Badge variant="secondary" className="text-xs">{personalGoals.length}</Badge>
                            </div>
                            <div className="space-y-2 pl-6">
                              {personalGoals.map((goal) => (
                                <div key={goal.id} className="flex items-start space-x-2">
                                  <Checkbox
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
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{goal.title}</p>
                                    {goal.description && (
                                      <p className="text-xs text-muted-foreground truncate">{goal.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {goal.progress}%
                                      </Badge>
                                      {goal.deadline && (
                                        <span className="text-xs text-muted-foreground">
                                          Due {format(goal.deadline, 'MMM dd')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
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
          <Button type="submit" form="add-output-form">Add Output</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
