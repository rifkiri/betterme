import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Goal, WeeklyOutput } from '@/types/productivity';

const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['work', 'personal']),
  deadline: z.date().optional(),
  linkedOutputIds: z.array(z.string()).optional(),
  selectedGoalId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddGoalDialogProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdDate' | 'progress'>) => void;
  onJoinWorkGoal?: (goalId: string) => void;
  allGoals?: Goal[];
  currentUserId?: string;
  userRole?: string;
  weeklyOutputs?: WeeklyOutput[];
}

export const AddGoalDialog = ({ 
  onAddGoal, 
  onJoinWorkGoal,
  allGoals = [],
  currentUserId,
  userRole,
  weeklyOutputs = [] 
}: AddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isJoiningGoal, setIsJoiningGoal] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      deadline: undefined,
      linkedOutputIds: [],
      selectedGoalId: '',
    },
  });

  const onSubmit = (data: FormData) => {
    if (isJoiningGoal && data.selectedGoalId && onJoinWorkGoal) {
      // Join existing goal
      onJoinWorkGoal(data.selectedGoalId);
    } else if (data.title && data.title.trim()) {
      // Create new goal
      let deadline = data.deadline;
      if (deadline) {
        deadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
      }

      onAddGoal({
        title: data.title,
        description: data.description,
        category: data.category,
        deadline: deadline,
        completed: false,
        archived: false,
        linkedOutputIds: data.linkedOutputIds || [],
      });
    }
    
    form.reset();
    setIsJoiningGoal(false);
    setOpen(false);
  };

  // Get today's date and set time to start of day for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter available outputs (not completed)
  const availableOutputs = weeklyOutputs.filter(output => output.progress < 100);

  // Filter available work goals for managers to join
  const isManager = userRole === 'manager' || userRole === 'admin';
  const availableWorkGoals = isManager ? allGoals.filter(goal => 
    goal.category === 'work' &&
    goal.userId !== currentUserId && // Not owned by current user
    !goal.memberIds?.includes(currentUserId || '') && // Not already a member
    !goal.leadIds?.includes(currentUserId || '') && // Not already a lead
    goal.coachId !== currentUserId && // Not already a coach
    !goal.archived &&
    goal.progress < 100
  ) : [];

  // Watch form values to determine button state
  const selectedGoalId = form.watch('selectedGoalId');
  const titleValue = form.watch('title');

  // Update button state based on form interaction
  const handleGoalSelection = (goalId: string) => {
    if (goalId) {
      setIsJoiningGoal(true);
      form.setValue('title', ''); // Clear title when selecting a goal
      form.setValue('selectedGoalId', goalId);
    } else {
      setIsJoiningGoal(false);
      form.setValue('selectedGoalId', '');
    }
  };

  const handleTitleChange = (value: string) => {
    if (value.trim()) {
      setIsJoiningGoal(false);
      form.setValue('selectedGoalId', ''); // Clear goal selection when typing
    }
    form.setValue('title', value);
  };

  // Validation for submit
  const canSubmit = isJoiningGoal ? !!selectedGoalId : !!(titleValue && titleValue.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 text-xs sm:text-sm h-8 sm:h-9">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Goal</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add New Goal</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
          <Form {...form}>
            <form id="goal-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title {!isJoiningGoal && '*'}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={isJoiningGoal ? "Select a goal below to join" : "e.g., Complete 10 tasks this week"} 
                      {...field}
                      disabled={isJoiningGoal}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Available Work Goals Dropdown for Managers */}
            {isManager && availableWorkGoals.length > 0 && (
              <FormField
                control={form.control}
                name="selectedGoalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Or join an existing work goal
                    </FormLabel>
                    <Select 
                      onValueChange={handleGoalSelection} 
                      value={field.value}
                      disabled={!!(titleValue && titleValue.trim())}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-2 border-border">
                          <SelectValue placeholder={titleValue && titleValue.trim() ? "Clear title to select a goal" : "Select a work goal to join"} />
                        </SelectTrigger>
                      </FormControl>
                       <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60">
                        <SelectItem value="" className="hover:bg-accent">
                          <span className="text-muted-foreground">None - Create new goal</span>
                        </SelectItem>
                        {availableWorkGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id} className="hover:bg-accent">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{goal.title}</span>
                              <span className="text-xs text-muted-foreground">
                                Progress: {goal.progress}% • Created by {goal.createdBy ? 'Manager' : 'System'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!isJoiningGoal && (
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
            )}


            {!isJoiningGoal && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border border-border">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                       <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60">
                        <SelectItem value="work" className="hover:bg-accent">Work</SelectItem>
                        <SelectItem value="personal" className="hover:bg-accent">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!isJoiningGoal && (
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
                              "w-full pl-3 text-left font-normal bg-background border border-border",
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
            )}

            {!isJoiningGoal && availableOutputs.length > 0 && (
              <FormField
                control={form.control}
                name="linkedOutputIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Outputs (Optional)</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          const currentIds = field.value || [];
                          if (currentIds.includes(value)) {
                            field.onChange(currentIds.filter(id => id !== value));
                          } else {
                            field.onChange([...currentIds, value]);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-background border border-border">
                          <SelectValue placeholder="Select outputs to link" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60">
                          {availableOutputs.map((output) => (
                            <SelectItem key={output.id} value={output.id} className="hover:bg-accent">
                              {output.title} ({output.progress}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map((outputId) => {
                          const output = availableOutputs.find(o => o.id === outputId);
                          return output ? (
                            <span key={outputId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {output.title}
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange(field.value?.filter(id => id !== outputId));
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
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
        
        <div className="flex justify-end space-x-2 pt-4 shrink-0">
          <Button type="button" variant="outline" onClick={() => {
            form.reset();
            setIsJoiningGoal(false);
            setOpen(false);
          }}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="goal-form"
            disabled={!canSubmit}
            className={isJoiningGoal ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {isJoiningGoal ? (
              <>
                <Users className="h-4 w-4 mr-2" />
                Join Goal
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};