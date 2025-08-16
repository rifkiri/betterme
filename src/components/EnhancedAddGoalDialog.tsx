import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Plus, Target, X, Users, UserCog, UserCheck, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { Goal, WeeklyOutput } from '@/types/productivity';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetValue: z.number().min(1, 'Target value must be at least 1'),
  unit: z.string().optional(),
  category: z.enum(['work', 'personal']),
  deadline: z.date().optional(),
  linkedOutputIds: z.array(z.string()).optional(),
  coachId: z.string().optional(),
  leadIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EnhancedAddGoalDialogProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'createdDate'>) => void;
  weeklyOutputs?: WeeklyOutput[];
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  userRole?: string;
}

export const EnhancedAddGoalDialog = ({ 
  onAddGoal, 
  weeklyOutputs = [], 
  availableUsers = [],
  currentUserId,
  userRole
}: EnhancedAddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const isManager = userRole === 'manager' || userRole === 'admin';
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      targetValue: 1,
      unit: '',
      category: 'personal',
      deadline: undefined,
      linkedOutputIds: [],
      coachId: '',
      leadIds: [],
      memberIds: [],
    },
  });

  const watchCategory = form.watch('category');

  const onSubmit = (data: FormData) => {
    let deadline = data.deadline;
    if (deadline) {
      deadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
    }

    onAddGoal({
      title: data.title,
      description: data.description,
      targetValue: data.targetValue,
      currentValue: 0,
      unit: data.unit || '',
      category: data.category,
      deadline: deadline,
      completed: false,
      archived: false,
      linkedOutputIds: data.linkedOutputIds || [],
      coachId: data.category === 'work' ? (selectedCoach || undefined) : undefined,
      leadIds: data.category === 'work' ? (selectedLeads.length > 0 ? selectedLeads : undefined) : undefined,
      memberIds: data.category === 'work' ? (selectedMembers.length > 0 ? selectedMembers : undefined) : undefined,
      createdBy: data.category === 'work' ? currentUserId : undefined,
    });
    form.reset();
    setSelectedCoach('');
    setSelectedLeads([]);
    setSelectedMembers([]);
    setOpen(false);
  };

  const toggleUserSelection = (userId: string, type: 'lead' | 'member') => {
    if (type === 'lead') {
      setSelectedLeads(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    } else {
      setSelectedMembers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const removeUser = (userId: string, type: 'lead' | 'member') => {
    if (type === 'lead') {
      setSelectedLeads(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== userId));
    }
  };

  const getSelectedUsers = (type: 'coach' | 'lead' | 'member') => {
    if (type === 'coach') {
      return selectedCoach ? availableUsers.filter(u => u.id === selectedCoach) : [];
    }
    if (type === 'lead') {
      return availableUsers.filter(u => selectedLeads.includes(u.id));
    }
    return availableUsers.filter(u => selectedMembers.includes(u.id));
  };

  const availableOutputs = weeklyOutputs.filter(output => output.progress < 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Add New Goal
          </DialogTitle>
          <DialogDescription>
            Create a new goal to track your progress. Work goals allow team collaboration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter goal title" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="personal">Personal</SelectItem>
                        {isManager && <SelectItem value="work">Work</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your goal..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., hours, tasks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white",
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
                      <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Work Goal Role Assignments */}
            {watchCategory === 'work' && isManager && (
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
                  <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a coach (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="">No coach assigned</SelectItem>
                      {availableUsers
                        .filter(user => user.role === 'manager' || user.role === 'admin')
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {getSelectedUsers('coach').map(user => (
                    <Badge key={user.id} variant="secondary" className="bg-blue-100 text-blue-800">
                      <UserCog className="h-3 w-3 mr-1" />
                      {user.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => setSelectedCoach('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Leads Selection */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Leads (Optional)</span>
                  </div>
                  <Select 
                    value={selectedLeads.length > 0 ? selectedLeads[selectedLeads.length - 1] : ""} 
                    onValueChange={(value) => {
                      if (value && !selectedLeads.includes(value)) {
                        setSelectedLeads(prev => [...prev, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select leads (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 max-h-60 overflow-y-auto">
                      <SelectItem value="">Add a lead</SelectItem>
                      {availableUsers
                        .filter(user => !selectedLeads.includes(user.id))
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedUsers('lead').map(user => (
                      <Badge key={user.id} variant="secondary" className="bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {user.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeUser(user.id, 'lead')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Members Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Members (Optional)</span>
                  </div>
                  <Select 
                    value={selectedMembers.length > 0 ? selectedMembers[selectedMembers.length - 1] : ""} 
                    onValueChange={(value) => {
                      if (value && !selectedMembers.includes(value)) {
                        setSelectedMembers(prev => [...prev, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select members (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 max-h-60 overflow-y-auto">
                      <SelectItem value="">Add a member</SelectItem>
                      {availableUsers
                        .filter(user => !selectedMembers.includes(user.id))
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedUsers('member').map(user => (
                      <Badge key={user.id} variant="secondary" className="bg-purple-100 text-purple-800">
                        <User className="h-3 w-3 mr-1" />
                        {user.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeUser(user.id, 'member')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Link Weekly Outputs */}
            {availableOutputs.length > 0 && (
              <FormField
                control={form.control}
                name="linkedOutputIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Link to Weekly Outputs (Optional)</FormLabel>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableOutputs.map((output) => (
                        <FormField
                          key={output.id}
                          control={form.control}
                          name="linkedOutputIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={output.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(output.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), output.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== output.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <label className="text-sm font-medium">
                                    {output.title}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    Progress: {output.progress}%
                                  </p>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Goal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};