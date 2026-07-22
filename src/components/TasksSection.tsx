
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday, isSameDay } from 'date-fns';
import { Search } from 'lucide-react';
import { Task, WeeklyOutput, Goal } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskItemWithPomodoro } from './TaskItemWithPomodoro';
import { DeletedTasksDialog } from './DeletedTasksDialog';
import { CompletedTasksDialog } from './CompletedTasksDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { DateNavigator } from './DateNavigator';

interface TasksSectionProps {
  tasks: Task[];
  deletedTasks: Task[];
  overdueTasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate' | 'isMoved'> & { assignedUserId?: string }) => void;
  onEditTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onToggleTask: (id: string) => void;
  onMoveTask: (taskId: string, targetDate: Date) => void;
  onDeleteTask: (id: string) => void;
  onRestoreTask: (id: string) => void;
  onPermanentlyDeleteTask: (id: string) => void;
  getTasksByDate: (date: Date) => Task[];
  weeklyOutputs?: WeeklyOutput[];
  goals?: Goal[];
}

export const TasksSection = ({ 
  tasks, 
  deletedTasks,
  overdueTasks, 
  onAddTask, 
  onEditTask,
  onToggleTask, 
  onMoveTask, 
  onDeleteTask,
  onRestoreTask,
  onPermanentlyDeleteTask,
  getTasksByDate,
  weeklyOutputs = [],
  goals = []
}: TasksSectionProps) => {
  const [selectedTaskDate, setSelectedTaskDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter/sort controls
  const [searchQuery, setSearchQuery] = useState('');
  const [outputFilter, setOutputFilter] = useState<string>('all'); // 'all' | 'none' | outputId
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'output'>('dueDate');

  // Keep selectedTask synchronized with the latest task data
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(task => task.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  const outputById = useMemo(() => {
    const m = new Map<string, WeeklyOutput>();
    weeklyOutputs.forEach(o => m.set(o.id, o));
    return m;
  }, [weeklyOutputs]);

  const priorityRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

  const applyFiltersAndSort = (list: Task[]) => {
    let out = list.filter(t => {
      if (outputFilter === 'none' && t.weeklyOutputId) return false;
      if (outputFilter !== 'all' && outputFilter !== 'none' && t.weeklyOutputId !== outputFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'output': {
          const an = a.weeklyOutputId ? outputById.get(a.weeklyOutputId)?.title || '' : '';
          const bn = b.weeklyOutputId ? outputById.get(b.weeklyOutputId)?.title || '' : '';
          return an.localeCompare(bn);
        }
        case 'dueDate':
        default: {
          const at = a.dueDate ? a.dueDate.getTime() : Infinity;
          const bt = b.dueDate ? b.dueDate.getTime() : Infinity;
          return at - bt;
        }
      }
    });
    return out;
  };

  // Enhanced task filtering for selected date
  const getTasksForSelectedDate = (date: Date) => {
    return tasks.filter(task => {
      if (task.dueDate && isSameDay(task.dueDate, date)) return true;
      if (task.completed && task.completedDate && isSameDay(task.completedDate, date)) return true;
      return false;
    });
  };

  const selectedDateTasks = applyFiltersAndSort(getTasksForSelectedDate(selectedTaskDate));
  const filteredOverdue = applyFiltersAndSort(overdueTasks);

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-4 pb-2 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Tasks</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isToday(selectedTaskDate) ? 'Today' : format(selectedTaskDate, 'MMM dd, yyyy')}
          </CardDescription>
        </div>
        <div className="space-y-2">
          {/* First row: Deleted and Add Task */}
          <div className="flex items-center gap-2">
            <DeletedTasksDialog 
              deletedTasks={deletedTasks}
              onRestoreTask={onRestoreTask}
              onPermanentlyDeleteTask={onPermanentlyDeleteTask}
            />
            <AddTaskDialog 
              onAddTask={(task) => onAddTask({ ...task, dueDate: selectedTaskDate, originalDueDate: selectedTaskDate })} 
              weeklyOutputs={weeklyOutputs}
            />
          </div>
          
          {/* Second row: Completed */}
          <div className="flex items-center">
            <CompletedTasksDialog tasks={tasks} onToggleTask={onToggleTask} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {/* Date Navigation */}
        <DateNavigator 
          selectedDate={selectedTaskDate} 
          onDateChange={setSelectedTaskDate} 
        />

        {/* Filter & Sort bar */}
        <div className="flex flex-wrap items-center gap-2 border-b pb-2">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          <Select value={outputFilter} onValueChange={setOutputFilter}>
            <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue placeholder="Output" /></SelectTrigger>
            <SelectContent className="bg-background z-50 max-h-64">
              <SelectItem value="all">All outputs</SelectItem>
              <SelectItem value="none">Unlinked only</SelectItem>
              {weeklyOutputs.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
            <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="High">🔴 High</SelectItem>
              <SelectItem value="Medium">🟡 Medium</SelectItem>
              <SelectItem value="Low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="dueDate">Sort: Due date</SelectItem>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="title">Sort: Title (A–Z)</SelectItem>
              <SelectItem value="output">Sort: Linked output</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks for Selected Date */}
        <div className="space-y-2">
          {selectedDateTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">No tasks match filters for this date</p>
          ) : (
            selectedDateTasks.map(task => (
              <TaskItemWithPomodoro 
                key={task.id} 
                task={task}
                onToggleTask={onToggleTask}
                onEditTask={onEditTask}
                onMoveTask={onMoveTask}
                onDeleteTask={onDeleteTask}
                onViewDetails={() => setSelectedTask(task)}
                weeklyOutputs={weeklyOutputs}
              />
            ))
          )}
        </div>

        {/* Show overdue tasks only when viewing today and they haven't been completed */}
        {isToday(selectedTaskDate) && filteredOverdue.filter(t => !t.completed).length > 0 && (
          <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
            <h4 className="text-sm font-medium text-orange-600 mb-2">Overdue Tasks</h4>
            <div className="space-y-2">
              {filteredOverdue.filter(t => !t.completed).map(task => (
                <TaskItemWithPomodoro
                  key={task.id} 
                  task={task}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onMoveTask={onMoveTask}
                  onDeleteTask={onDeleteTask}
                  onViewDetails={() => setSelectedTask(task)}
                  weeklyOutputs={weeklyOutputs}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onEditTask={onEditTask}
        onToggleTask={onToggleTask}
        weeklyOutputs={weeklyOutputs}
        goals={goals}
      />
    </Card>
  );
};
