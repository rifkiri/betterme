import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link2 } from 'lucide-react';
import { resourceLinksService, ResourceEntityType } from '@/services/ResourceLinksService';
import { ResourceLinksPanel } from './ResourceLinksPanel';

interface Props {
  entityType: ResourceEntityType;
  entityId: string;
  collaboratorIds: string[];
}

export const ResourceLinksQuickButton = ({ entityType, entityId, collaboratorIds }: Props) => {
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    resourceLinksService.countLinks(entityType, entityId).then(setCount).catch(() => {});
  };

  useEffect(() => { refresh(); }, [entityType, entityId]);
  useEffect(() => { if (!open) refresh(); }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50"
          title="Source links"
        >
          <Link2 className="h-3.5 w-3.5" />
          {count > 0 && <span className="font-medium">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end" onClick={(e) => e.stopPropagation()}>
        <ResourceLinksPanel
          entityType={entityType}
          entityId={entityId}
          collaboratorIds={collaboratorIds}
          compact
        />
      </PopoverContent>
    </Popover>
  );
};
