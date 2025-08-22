
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw } from 'lucide-react';
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
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Deleted ({deletedWeeklyOutputs.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deleted Weekly Outputs</DialogTitle>
          <DialogDescription>
            Restore or permanently delete your deleted weekly outputs
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {deletedWeeklyOutputs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No deleted weekly outputs</p>
          ) : (
            deletedWeeklyOutputs.map(output => (
              <div key={output.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{output.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {output.progress}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestore(output.id)}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    title="Restore output"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPermanentlyDelete(output.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    title="Permanently delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
