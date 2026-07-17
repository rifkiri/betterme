import { useEffect, useState } from 'react';
import { resourceLinksService, ResourceLink, ResourceEntityType } from '@/services/ResourceLinksService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Link2, Plus, Trash2, ExternalLink, Pencil, Check, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ResourceLinksPanelProps {
  entityType: ResourceEntityType;
  entityId: string;
  collaboratorIds: string[];
  compact?: boolean;
}

export const ResourceLinksPanel = ({
  entityType,
  entityId,
  collaboratorIds,
  compact = false,
}: ResourceLinksPanelProps) => {
  const { currentUser } = useCurrentUser();
  const [links, setLinks] = useState<ResourceLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const canEdit = !!currentUser && collaboratorIds.includes(currentUser.id);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await resourceLinksService.getLinks(entityType, entityId);
      setLinks(data);
    } catch {
      toast.error('Failed to load links');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [entityType, entityId]);

  const handleAdd = async () => {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error('Label and URL are required');
      return;
    }
    const url = newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
    setIsAdding(true);
    try {
      const link = await resourceLinksService.addLink(
        entityType, entityId, newLabel.trim(), url, currentUser!.id
      );
      setLinks(prev => [...prev, link]);
      setNewLabel('');
      setNewUrl('');
      setShowForm(false);
      toast.success('Link added');
    } catch {
      toast.error('Failed to add link');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceLinksService.deleteLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success('Link removed');
    } catch {
      toast.error('Failed to remove link');
    }
  };

  const startEdit = (link: ResourceLink) => {
    setEditingId(link.id);
    setEditLabel(link.label);
    setEditUrl(link.url);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await resourceLinksService.updateLink(id, editLabel.trim(), editUrl.trim());
      setLinks(prev => prev.map(l => l.id === id
        ? { ...l, label: editLabel.trim(), url: editUrl.trim() }
        : l
      ));
      setEditingId(null);
      toast.success('Link updated');
    } catch {
      toast.error('Failed to update link');
    }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return null;
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium text-sm text-gray-900">Source Links & Workspaces</h4>
          {links.length > 0 && (
            <Badge variant="secondary" className="text-xs">{links.length}</Badge>
          )}
        </div>
        {canEdit && !showForm && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        )}
      </div>

      {canEdit && showForm && (
        <div className="border rounded-md p-2 space-y-2 bg-gray-50">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              value={newLabel}
              placeholder="e.g. Figma Wireframes"
              className="h-8 text-sm"
              onChange={e => setNewLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input
              value={newUrl}
              placeholder="https://..."
              className="h-8 text-sm"
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={isAdding}>
              {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading links…
        </div>
      ) : links.length === 0 ? (
        <p className="text-xs text-gray-500 py-2">
          {canEdit ? 'No links yet. Add a source or workspace link above.' : 'No links added.'}
        </p>
      ) : (
        <ul className="space-y-1">
          {links.map(link => {
            const favicon = getFavicon(link.url);
            return (
              <li key={link.id} className="flex items-center gap-2 p-2 border rounded-md bg-white hover:bg-gray-50 group">
                {favicon && (
                  <img
                    src={favicon}
                    alt=""
                    className="h-4 w-4 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                {editingId === link.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input value={editLabel} className="h-7 text-xs" onChange={e => setEditLabel(e.target.value)} />
                    <Input value={editUrl} className="h-7 text-xs" onChange={e => setEditUrl(e.target.value)} />
                    <button onClick={() => handleSaveEdit(link.id)} className="text-green-600 hover:text-green-800 p-1">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700 p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                      title={link.url}
                    >
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">
                      {link.addedByName}
                    </span>
                    {canEdit && link.addedBy === currentUser?.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(link)} className="text-gray-400 hover:text-blue-600 p-1" title="Edit">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleDelete(link.id)} className="text-gray-400 hover:text-red-600 p-1" title="Remove">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
