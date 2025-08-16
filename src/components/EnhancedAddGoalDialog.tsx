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
  onJoinWorkGoal: (goalId: string) => void;
  goals: Goal[];
  weeklyOutputs?: WeeklyOutput[];
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  userRole?: string;
}

export const EnhancedAddGoalDialog = ({ 
  onAddGoal,
  onJoinWorkGoal,
  goals,
  weeklyOutputs = [], 
  availableUsers = [],
  currentUserId,
  userRole
}: EnhancedAddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedWorkGoal, setSelectedWorkGoal] = useState<string>('');
  const [isJoiningMode, setIsJoiningMode] = useState(false);

  const isManager = userRole === 'manager' || userRole === 'admin';
  const isEmployee = userRole === 'team-member';

  // Filter available work goals for joining
  const availableWorkGoals = goals.filter(goal => 
    goal.category === 'work' &&
    goal.progress < 100 &&
    !goal.memberIds?.includes(currentUserId || '') &&
    !goal.leadIds?.includes(currentUserId || '') &&
    goal.coachId !== currentUserId
  );
  
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
    // Handle joining existing work goal
    if (isJoiningMode && selectedWorkGoal) {
      onJoinWorkGoal(selectedWorkGoal);
      form.reset();
      setSelectedWorkGoal('');
      setIsJoiningMode(false);
      setOpen(false);
      return;
    }
    let deadline = data.deadline;
    if (deadline) {
      deadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
    }

    // Auto-assign current user as member for work goals if they're not a manager
    let finalMemberIds = selectedMembers;
    if (data.category === 'work' && userRole === 'team-member' && currentUserId && !finalMemberIds.includes(currentUserId)) {
      finalMemberIds = [...finalMemberIds, currentUserId];
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
      memberIds: data.category === 'work' ? (finalMemberIds.length > 0 ? finalMemberIds : undefined) : undefined,
      createdBy: data.category === 'work' ? currentUserId : undefined,
    });
    form.reset();
    setSelectedCoach('');
    setSelectedLeads([]);
    setSelectedMembers([]);
    setSelectedWorkGoal('');
    setIsJoiningMode(false);
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
            {isJoiningMode ? 'Join Work Goal' : 'Add New Goal'}
          </DialogTitle>
          <DialogDescription>
            {isJoiningMode 
              ? 'Select an existing work goal to join as a member and contribute to its completion.'
              : 'Create a new goal to track your progress. Work goals allow team collaboration.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information - Category moved above title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                     <Select onValueChange={(value) => {
                       field.onChange(value);
                       // Handle work category selection for employees
                       if (value === 'work' && isEmployee) {
                         if (availableWorkGoals.length > 0) {
                           setIsJoiningMode(true);
                         } else {
                           setIsJoiningMode(false);
                         }
                         // Auto-assign employee as member for work goals when creating
                         if (currentUserId && !isJoiningMode) {
                           setSelectedMembers(prev => 
                             prev.includes(currentUserId) ? prev : [...prev, currentUserId]
                           );
                         }
                       } else {
                         setIsJoiningMode(false);
                       }
                     }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isJoiningMode && watchCategory === 'work' && isEmployee ? 'Select Work Goal' : 'Title'}
                    </FormLabel>
                    <FormControl>
                      {isJoiningMode && watchCategory === 'work' && isEmployee ? (
                        <Select value={selectedWorkGoal} onValueChange={setSelectedWorkGoal}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a work goal to join" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            {availableWorkGoals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title} ({goal.progress}% complete)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="Enter goal title" {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isJoiningMode && (
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
            )}

            {!isJoiningMode && (
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
            )}

            {/* Work Goal Role Assignments - only show for managers creating new goals */}
            {watchCategory === 'work' && isManager && !isJoiningMode && (
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
                  <Select value={selectedCoach} onValueChange={(value) => setSelectedCoach(value === 'none' ? '' : value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a coach (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="none">No coach assigned</SelectItem>
                      {availableUsers
                        .filter(user => user.role === 'manager' || user.role === 'admin' || user.role === 'team-member')
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
                       if (value && value !== 'add_lead' && !selectedLeads.includes(value)) {
                         setSelectedLeads(prev => [...prev, value]);
                       }
                     }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select leads (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 max-h-60 overflow-y-auto">
                      <SelectItem value="add_lead">Add a lead</SelectItem>
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
                       if (value && value !== 'add_member' && !selectedMembers.includes(value)) {
                         setSelectedMembers(prev => [...prev, value]);
                       }
                     }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select members (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 max-h-60 overflow-y-auto">
                      <SelectItem value="add_member">Add a member</SelectItem>
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

            {/* Link to Weekly Outputs - only show when creating new goals */}
            {!isJoiningMode && availableOutputs.length > 0 && (
              <div className="space-y-3">
                <FormLabel className="text-base font-medium">Link to Weekly Outputs (Optional)</FormLabel>
                <FormField
                  control={form.control}
                  name="linkedOutputIds"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableOutputs.map((output) => (
                          <FormField
                            key={output.id}
                            control={form.control}
                            name="linkedOutputIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={output.id}
                                  className="flex flex-row items-center space-x-3 space-y-0"
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
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {output.title} ({output.progress}% complete)
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Show work goal details when joining */}
            {isJoiningMode && selectedWorkGoal && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Joining Work Goal</h3>
                <p className="text-sm text-blue-700">
                  You will be added as a member to this work goal and can contribute to its completion.
                </p>
              </Card>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isJoiningMode && !selectedWorkGoal}
              >
                {isJoiningMode ? 'Join Goal' : 'Add Goal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};