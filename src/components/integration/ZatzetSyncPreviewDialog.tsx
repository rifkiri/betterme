import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, Target } from 'lucide-react';
import { ZatzetInitiative } from '@/types/integration';

interface ZatzetSyncPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiatives: ZatzetInitiative[];
  onImport: (selectedIds: string[]) => Promise<void>;
  isImporting: boolean;
}

export const ZatzetSyncPreviewDialog: React.FC<ZatzetSyncPreviewDialogProps> = ({
  open,
  onOpenChange,
  initiatives,
  onImport,
  isImporting,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === initiatives.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initiatives.map(i => i.id)));
    }
  };

  const handleImport = async () => {
    await onImport(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Initiatives as Goals</DialogTitle>
          <DialogDescription>
            Select initiatives from Zatzet OKR to import as Goals in the Marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === initiatives.length && initiatives.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({initiatives.length} initiatives)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Zatzet Initiative</span>
              <ArrowRight className="h-4 w-4" />
              <span>BetterMe Goal</span>
            </div>
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            {initiatives.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground text-center">
                  No initiatives found in Zatzet OKR.
                  <br />
                  Create some initiatives first, then sync again.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {initiatives.map((initiative) => (
                  <div
                    key={initiative.id}
                    className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleSelection(initiative.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(initiative.id)}
                      onCheckedChange={() => toggleSelection(initiative.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium truncate">{initiative.title}</span>
                      </div>
                      {initiative.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {initiative.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {initiative.status && (
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(initiative.status)}
                          >
                            {initiative.status}
                          </Badge>
                        )}
                        {initiative.progress !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Progress: {initiative.progress}%
                          </span>
                        )}
                        {initiative.target_date && (
                          <span className="text-xs text-muted-foreground">
                            Due: {initiative.target_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedIds.size > 0 && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>{selectedIds.size}</strong> initiative(s) will be imported as Goals with:
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Category: <strong>Work</strong></li>
                <li>Visibility: <strong>All</strong> (visible in Marketplace)</li>
                <li>Status: Based on initiative status</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${selectedIds.size} Initiative${selectedIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
