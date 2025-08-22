import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Minus, Plus } from 'lucide-react';
import { WeeklyOutput } from '@/types/productivity';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CompletedWeeklyOutputsDialogProps {
  weeklyOutputs: WeeklyOutput[];
  onUpdateProgress: (outputId: string, newProgress: number) => void;
}

export const CompletedWeeklyOutputsDialog = ({ 
  weeklyOutputs,
  onUpdateProgress
}: CompletedWeeklyOutputsDialogProps) => {
  const { toast } = useToast();
  const completedOutputs = weeklyOutputs.filter(output => output.progress >= 100);

  const handleProgressChange = (outputId: string, newProgress: number) => {
    onUpdateProgress(outputId, newProgress);
    if (newProgress < 100) {
      toast({
        title: "Output reverted",
        description: "Weekly output moved back to active status",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          <span>Completed ({completedOutputs.length})</span>
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
                
                <div className="mb-3 space-y-2">
                  <Progress value={output.progress} className="h-2" />
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleProgressChange(output.id, output.progress - 10)} 
                      disabled={output.progress <= 0} 
                      className="h-8 w-8 p-0"
                      title="Decrease Progress"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleProgressChange(output.id, output.progress + 10)} 
                      disabled={output.progress >= 100} 
                      className="h-8 w-8 p-0"
                      title="Increase Progress"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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