import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChildItem {
  id: string;
  title: string;
  progress: number; // 0-100 (tasks -> 100 if completed else 0)
  weight?: number;
}

interface WeightedProgressPanelProps {
  mode: 'manual' | 'weighted';
  onModeChange: (mode: 'manual' | 'weighted') => Promise<void> | void;
  items: ChildItem[];
  childLabel: string; // "output" or "task"
  onSaveWeights: (weights: { id: string; weight: number }[]) => Promise<void> | void;
}

export const WeightedProgressPanel = ({
  mode,
  onModeChange,
  items,
  childLabel,
  onSaveWeights,
}: WeightedProgressPanelProps) => {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init: Record<string, number> = {};
    items.forEach((c) => { init[c.id] = c.weight ?? 1; });
    setWeights(init);
  }, [children]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveWeights(items.map(c => ({ id: c.id, weight: Number(weights[c.id]) || 0 })));
      toast({ title: 'Weights saved', description: 'Progress will recalculate automatically.' });
    } catch (e: any) {
      toast({ title: 'Failed to save weights', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600" />
          <Label className="text-sm font-semibold">Progress Weight Settings</Label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {mode === 'weighted' ? 'Custom Weighted' : 'Manual'}
          </span>
          <Switch
            checked={mode === 'weighted'}
            onCheckedChange={(checked) => onModeChange(checked ? 'weighted' : 'manual')}
          />
        </div>
      </div>

      {mode === 'weighted' && (
        <>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">No linked {childLabel}s yet. Progress will remain at 0% until children are linked.</p>
          ) : (
            <div className="space-y-2">
              {items.map((child) => {
                const w = Number(weights[child.id]) || 0;
                const rel = totalWeight > 0 ? Math.round((w / totalWeight) * 1000) / 10 : 0;
                return (
                  <div key={child.id} className="flex items-center gap-2 bg-background rounded p-2 border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{child.title}</p>
                      <p className="text-[11px] text-muted-foreground">Relative: {rel}%</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{child.progress}%</Badge>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={weights[child.id] ?? 1}
                      onChange={(e) => setWeights(prev => ({ ...prev, [child.id]: Number(e.target.value) }))}
                      className="w-20 h-8 text-xs"
                    />
                  </div>
                );
              })}
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Weights'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
