
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
import { WeeklyOutput } from '@/types/productivity';

interface DeletedWeeklyOutputsDialogProps {
  deletedWeeklyOutputs: WeeklyOutput[];
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

export const DeletedWeeklyOutputsDialog = ({ 
  deletedWeeklyOutputs, 
  onRestore, 
  onPermanentlyDelete 
}: DeletedWeeklyOutputsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Deleted ({deletedWeeklyOutputs.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deleted Weekly Outputs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {deletedWeeklyOutputs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No deleted weekly outputs</p>
          ) : (
            deletedWeeklyOutputs.map((output) => (
              <div key={output.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{output.title}</p>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {output.progress}%
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <Progress value={output.progress} className="h-2" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore(output.id)}
                    className="text-xs px-2 py-1"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onPermanentlyDelete(output.id)}
                    className="text-xs px-2 py-1"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
