
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
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarIcon } from 'lucide-react';
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
  goalId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddWeeklyOutputDialogProps {
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => Promise<void>;
  availableGoals?: Goal[];
}

export const AddWeeklyOutputDialog = ({ onAddWeeklyOutput, availableGoals = [] }: AddWeeklyOutputDialogProps) => {
  const [open, setOpen] = useState(false);

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: undefined,
      goalId: undefined,
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
      linkedGoalId: data.goalId !== "none" ? data.goalId : undefined,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 min-w-0">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Add Outputs</span>
          <span className="sm:hidden">+</span>
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

            <FormField
              control={form.control}
              name="goalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Link to Goal (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-50 bg-background border border-border shadow-lg">
                      <SelectItem value="none">No goal</SelectItem>
                      {activeGoals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id} className="py-3">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{goal.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                                  {goal.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {goal.progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
