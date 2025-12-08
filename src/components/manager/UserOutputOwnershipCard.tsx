import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckSquare } from 'lucide-react';

interface UserOutputOwnership {
  userId: string;
  userName: string;
  email: string;
  outputs: Array<{
    outputId: string;
    outputTitle: string;
    progress: number;
    linkedTasksCount: number;
  }>;
  totalOutputs: number;
}

interface UserOutputOwnershipCardProps {
  ownership: UserOutputOwnership;
  onViewDetails?: (userId: string) => void;
}

export const UserOutputOwnershipCard = ({ 
  ownership, 
  onViewDetails 
}: UserOutputOwnershipCardProps) => {
  const initials = ownership.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Only show active outputs (progress < 100)
  const activeOutputs = ownership.outputs.filter(o => o.progress < 100);
  const activeOutputsCount = activeOutputs.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* User Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{ownership.userName}</h3>
            <p className="text-xs text-muted-foreground">{ownership.email}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {activeOutputsCount} {activeOutputsCount === 1 ? 'Output' : 'Outputs'}
          </Badge>
        </div>

        {/* Outputs List */}
        <div className="space-y-2">
          {activeOutputs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No active outputs</p>
          ) : (
            activeOutputs.map((output) => (
              <div key={output.outputId} className="border-l-2 border-muted pl-3 py-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {output.outputTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        {output.linkedTasksCount} {output.linkedTasksCount === 1 ? 'task' : 'tasks'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {output.progress}% complete
                      </span>
                    </div>
                  </div>
                  <Progress value={output.progress} className="w-16 h-2" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(ownership.userId)}
            className="mt-3 w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View Employee Details →
          </button>
        )}
      </CardContent>
    </Card>
  );
};
