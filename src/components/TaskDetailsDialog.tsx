import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare, 
  Calendar, 
  Edit, 
  CheckCircle2,
  Link,
  Target,
  ArrowUp,
  Clock,
  User
} from 'lucide-react';
import { Task, WeeklyOutput, Goal } from '@/types/productivity';
import { format, isBefore } from 'date-fns';
import { useState } from 'react';
import { EditTaskDialog } from './EditTaskDialog';

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  weeklyOutputs: WeeklyOutput[];
  goals: Goal[];
}

export const TaskDetailsDialog = ({
  task,
  open,
  onOpenChange,
  onEditTask,
  onToggleTask,
  weeklyOutputs,
  goals
}: TaskDetailsDialogProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (!task) return null;

  const linkedOutput = weeklyOutputs.find(output => output.id === task.weeklyOutputId);
  
  const relatedGoals = goals.filter(goal => 
    linkedOutput && goal.linkedOutputIds?.includes(linkedOutput.id)
  );

  const isOverdue = task.dueDate && isBefore(task.dueDate, new Date()) && !task.completed;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Task Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Task Overview */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                  {task.completed && (
                    <Badge className="text-xs bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600">{task.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium">{format(task.createdDate, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{format(task.dueDate, 'MMM dd, yyyy')}</p>
                </div>
                {task.estimatedTime && (
                  <div>
                    <p className="text-xs text-gray-500">Estimated Time</p>
                    <p className="font-medium">{task.estimatedTime}</p>
                  </div>
                )}
                {task.completedDate && (
                  <div>
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="font-medium">{format(task.completedDate, 'MMM dd, yyyy')}</p>
                  </div>
                )}
              </div>

              {task.isMoved && task.originalDueDate && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <p className="text-orange-800">
                    Moved from: {format(task.originalDueDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              )}

              {task.taggedUsers && task.taggedUsers.length > 0 && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">Tagged for support: {task.taggedUsers.length} user(s)</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={task.completed ? "outline" : "default"}
                  onClick={() => onToggleTask(task.id)}
                  className="text-xs px-3"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </Button>
              </div>
            </div>

            {/* Linked Output */}
            {linkedOutput && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-blue-600" />
                  Part of Output
                </h4>
                
                <div className="p-3 border rounded-lg bg-white">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{linkedOutput.title}</h5>
                      {linkedOutput.description && (
                        <p className="text-xs text-gray-600 mt-1">{linkedOutput.description}</p>
                      )}
                    </div>
                    <Badge variant={linkedOutput.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                      {linkedOutput.progress}%
                    </Badge>
                  </div>
                  <Progress value={linkedOutput.progress} className="h-2 mb-2" />
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Due: {format(linkedOutput.dueDate, 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            )}

            {/* Related Goals */}
            {relatedGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600" />
                  Contributing to Goals ({relatedGoals.length})
                </h4>
                
                <div className="space-y-2">
                  {relatedGoals.map((goal) => {
const getCategoryColor = (category: Goal['category']) => {
                      switch (category) {
                        case 'work': return 'bg-blue-100 text-blue-800';
                        case 'personal': return 'bg-green-100 text-green-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };

                    return (
                      <div key={goal.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-sm">{goal.title}</h5>
                              <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                                {goal.category}
                              </Badge>
                            </div>
                            {goal.description && (
                              <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                            )}
                          </div>
                          <Badge variant={goal.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                            {goal.progress}%
                          </Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2 mb-2" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Progress: {goal.progress}%</span>
                          {goal.deadline && (
                            <span>Due: {format(goal.deadline, 'MMM dd')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Impact Analysis */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Task Impact</h4>
              <div className="space-y-2 text-sm">
                {linkedOutput && (
                  <p className="text-blue-700">
                    This task contributes to the "{linkedOutput.title}" output
                  </p>
                )}
                {relatedGoals.length > 0 && (
                  <p className="text-blue-700">
                    Completing this task helps achieve {relatedGoals.length} goal{relatedGoals.length !== 1 ? 's' : ''}
                  </p>
                )}
                {!linkedOutput && relatedGoals.length === 0 && (
                  <p className="text-blue-700">
                    This is a standalone task not linked to any outputs or goals
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setEditingTask(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {editingTask && (
        <EditTaskDialog 
          task={editingTask} 
          open={true} 
          onOpenChange={open => !open && setEditingTask(null)} 
          onSave={onEditTask}
          weeklyOutputs={weeklyOutputs}
        />
      )}
    </>
  );
};