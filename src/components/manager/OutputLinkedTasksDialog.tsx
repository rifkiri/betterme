import React from 'react';
import { BaseDialog } from '@/components/ui/base-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, CheckSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { User as UserType } from '@/types/userTypes';

interface LinkedTask {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Date;
  userId: string;
}

interface OutputLinkedTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outputTitle: string;
  tasks: LinkedTask[];
  userProfiles: Map<string, UserType>;
}

const getPriorityVariant = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'outline';
  }
};

export const OutputLinkedTasksDialog = ({
  open,
  onOpenChange,
  outputTitle,
  tasks,
  userProfiles
}: OutputLinkedTasksDialogProps) => {
  const getOwnerName = (userId: string): string => {
    const user = userProfiles.get(userId);
    return user?.name || 'Unknown';
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Linked Tasks"
      description={outputTitle}
      headerIcon={<FileText className="h-5 w-5 text-primary" />}
      maxWidth="2xl"
    >
      <ScrollArea className="max-h-[60vh]">
        {tasks.length > 0 ? (
          <div className="space-y-3 pr-4">
            {tasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                      </div>
                      <Badge variant={getPriorityVariant(task.priority)} className="text-xs flex-shrink-0">
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due: {format(task.dueDate, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>Owner: {getOwnerName(task.userId)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tasks linked to this output</p>
          </div>
        )}
      </ScrollArea>
    </BaseDialog>
  );
};
