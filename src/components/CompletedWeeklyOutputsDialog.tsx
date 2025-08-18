import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { WeeklyOutput } from '@/types/productivity';
import { format } from 'date-fns';

interface CompletedWeeklyOutputsDialogProps {
  weeklyOutputs: WeeklyOutput[];
}

export const CompletedWeeklyOutputsDialog = ({ 
  weeklyOutputs
}: CompletedWeeklyOutputsDialogProps) => {
  const completedOutputs = weeklyOutputs.filter(output => output.progress >= 100);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          Completed ({completedOutputs.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Completed Weekly Outputs
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {completedOutputs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No completed weekly outputs yet</p>
          ) : (
            completedOutputs.map((output) => (
              <div key={output.id} className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-foreground leading-relaxed flex-1">{output.title}</p>
                  <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">
                    {output.progress}%
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <Progress value={output.progress} className="h-2" />
                </div>
                
                {output.dueDate && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Due: {format(new Date(output.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};