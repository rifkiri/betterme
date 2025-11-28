import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Minus, Plus } from 'lucide-react';
import { WeeklyOutput } from '@/types/productivity';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ListDialog } from '@/components/ui/list-dialog';
import { useDialog } from '@/hooks/useDialog';

interface CompletedWeeklyOutputsDialogProps {
  weeklyOutputs: WeeklyOutput[];
  onUpdateProgress: (outputId: string, newProgress: number) => void;
}

export const CompletedWeeklyOutputsDialog = ({ 
  weeklyOutputs,
  onUpdateProgress
}: CompletedWeeklyOutputsDialogProps) => {
  const dialog = useDialog();
  const { toast } = useToast();
  const completedOutputs = weeklyOutputs.filter(output => output.progress >= 100);

  const handleProgressChange = (outputId: string, newProgress: number) => {
    onUpdateProgress(outputId, newProgress);
    if (newProgress < 100) {
      toast({
        title: "Output reverted",
        description: "Bi-weekly output moved back to active status",
      });
    }
  };

  const renderOutput = (output: WeeklyOutput) => (
    <>
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
    </>
  );

  return (
    <ListDialog
      open={dialog.open}
      onOpenChange={dialog.setOpen}
      title="Completed Bi-Weekly Outputs"
      headerIcon={<Trophy className="h-5 w-5 text-amber-600" />}
      maxWidth="2xl"
      scrollHeight="96"
      gradientItems={true}
      items={completedOutputs}
      renderItem={renderOutput}
      triggerIcon={<Trophy className="h-4 w-4 text-amber-600" />}
      triggerText="Completed"
      emptyMessage="No completed bi-weekly outputs yet"
    />
  );
};