
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { WeeklyOutput } from '@/types/productivity';
import { taskFormSchema, TaskFormValues } from './taskFormSchema';
import { UserSelector } from './UserSelector';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GoalVisibilitySelector } from '@/components/ui/GoalVisibilitySelector';
import { useUserRole } from '@/hooks/useUserRole';

interface TaskFormProps {
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
  weeklyOutputs: WeeklyOutput[];
  initialValues?: TaskFormValues;
}

export const TaskForm = ({
  onSubmit,
  onCancel,
  weeklyOutputs,
  initialValues
}: TaskFormProps) => {
  const { profile } = useUserProfile();
  const { isManagerOrAdmin } = useUserRole();
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialValues || {
      title: '',
      description: '',
      priority: 'Medium',
      estimatedTime: '',
      dueDate: new Date(),
      weeklyOutputId: undefined,
      taggedUsers: [],
      visibility: 'all'
    }
  });

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit(values);
    if (!initialValues) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form id="task-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 p-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Task Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Complete project proposal" {...field} />
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
              <FormLabel className="text-sm font-medium">Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your task..." 
                  className="resize-none h-20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="estimatedTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Estimated Time (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2h, 30m" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="weeklyOutputId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Link to Weekly Output (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a weekly output" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No weekly output</SelectItem>
                  {weeklyOutputs
                    .filter(output => output.progress < 100 && !output.isDeleted)
                    .map(output => (
                    <SelectItem key={output.id} value={output.id}>
                      {output.title}
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
          name="taggedUsers"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Tag Users for Support (Optional)</FormLabel>
              <FormControl>
                <UserSelector
                  selectedUserIds={field.value || []}
                  onSelectionChange={(userIds) => field.onChange(userIds)}
                  currentUserId={profile?.id}
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
            <FormItem>
              <FormLabel className="text-sm font-medium">Due Date</FormLabel>
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
                        <span>Pick a date</span>
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
                    disabled={(date) =>
                      date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {isManagerOrAdmin && (
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <GoalVisibilitySelector
                  value={field.value || 'all'}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
      </form>
    </Form>
  );
};
