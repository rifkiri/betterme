import React from 'react';
import { BaseDialog } from '@/components/ui/base-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, FileText, Target } from 'lucide-react';
import { format } from 'date-fns';
import { User as UserType } from '@/types/userTypes';

interface LinkedOutput {
  id: string;
  title: string;
  progress: number;
  dueDate: Date;
  userId: string;
}

interface GoalLinkedOutputsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  outputs: LinkedOutput[];
  userProfiles: Map<string, UserType>;
}

export const GoalLinkedOutputsDialog = ({
  open,
  onOpenChange,
  goalTitle,
  outputs,
  userProfiles
}: GoalLinkedOutputsDialogProps) => {
  const getOwnerName = (userId: string): string => {
    const user = userProfiles.get(userId);
    return user?.name || 'Unknown';
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Linked Outputs"
      description={goalTitle}
      headerIcon={<Target className="h-5 w-5 text-primary" />}
      maxWidth="2xl"
    >
      <ScrollArea className="max-h-[60vh]">
        {outputs.length > 0 ? (
          <div className="space-y-3 pr-4">
            {outputs.map((output) => (
              <Card key={output.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h4 className="font-medium text-sm leading-tight">{output.title}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {output.progress}%
                      </Badge>
                    </div>
                    
                    <Progress value={output.progress} className="h-2" />
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due: {format(output.dueDate, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>Owner: {getOwnerName(output.userId)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No outputs linked to this goal</p>
          </div>
        )}
      </ScrollArea>
    </BaseDialog>
  );
};
