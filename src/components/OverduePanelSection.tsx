import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckSquare, FileText, Target } from 'lucide-react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { isTaskOverdue, isWeeklyOutputOverdue, isGoalOverdue } from '@/utils/dateUtils';
import { format, differenceInDays, subDays } from 'date-fns';

interface OverduePanelSectionProps {
  userId: string;
}

type FilterMode = 'all-overdue' | 'last-30-days' | 'by-priority' | 'sales' | 'goals';

interface OverdueEntry {
  id: string;
  type: 'task' | 'output' | 'goal';
  title: string;
  daysOverdue: number;
  priority?: 'High' | 'Medium' | 'Low';
  subcategory?: string;
  progress?: number;
  linkedGoalSubcategory?: string;
  dueDate: Date;
}

const priorityRank = { High: 0, Medium: 1, Low: 2 } as const;

export const OverduePanelSection = ({ userId }: OverduePanelSectionProps) => {
  const [filter, setFilter] = useState<FilterMode>('all-overdue');
  const [items, setItems] = useState<OverdueEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [tasks, outputs, goals] = await Promise.all([
          supabaseDataService.getTasks(userId),
          supabaseDataService.getWeeklyOutputs(userId),
          supabaseDataService.getGoals(userId),
        ]);
        if (cancelled) return;

        const now = new Date();
        const goalById = new Map((goals || []).map(g => [g.id, g]));
        const entries: OverdueEntry[] = [];

        (tasks || []).forEach(t => {
          if (t.completed || t.isDeleted || !t.dueDate) return;
          if (!isTaskOverdue(t.dueDate)) return;
          const linkedGoal = (t as any).linkedGoalId ? goalById.get((t as any).linkedGoalId) : undefined;
          entries.push({
            id: t.id,
            type: 'task',
            title: t.title,
            daysOverdue: differenceInDays(now, t.dueDate),
            priority: t.priority as any,
            linkedGoalSubcategory: linkedGoal?.subcategory,
            dueDate: t.dueDate,
          });
        });

        (outputs || []).forEach(o => {
          if (o.isDeleted || !o.dueDate) return;
          if (!isWeeklyOutputOverdue(o.dueDate, o.progress, o.completedDate, o.createdDate)) return;
          const linkedGoal = o.linkedGoalId ? goalById.get(o.linkedGoalId) : undefined;
          entries.push({
            id: o.id,
            type: 'output',
            title: o.title,
            daysOverdue: differenceInDays(now, o.dueDate),
            progress: o.progress,
            linkedGoalSubcategory: linkedGoal?.subcategory,
            dueDate: o.dueDate,
          });
        });

        (goals || []).forEach(g => {
          if (g.userId !== userId) return;
          if (!isGoalOverdue(g)) return;
          entries.push({
            id: g.id,
            type: 'goal',
            title: g.title,
            daysOverdue: differenceInDays(now, g.deadline as Date),
            progress: g.progress,
            subcategory: g.subcategory,
            dueDate: g.deadline as Date,
          });
        });

        setItems(entries);
      } catch (err) {
        console.error('OverduePanelSection: failed to load overdue items', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const filteredItems = useMemo(() => {
    let out = [...items];
    switch (filter) {
      case 'last-30-days': {
        const cutoff = subDays(new Date(), 30);
        out = out.filter(i => i.dueDate >= cutoff);
        break;
      }
      case 'by-priority':
        out.sort((a, b) => (priorityRank[a.priority ?? 'Medium'] ?? 1) - (priorityRank[b.priority ?? 'Medium'] ?? 1));
        break;
      case 'sales':
        out = out.filter(i => i.subcategory === 'sales' || i.linkedGoalSubcategory === 'sales');
        break;
      case 'goals':
        out = out.filter(i => i.type === 'goal');
        break;
    }
    if (filter !== 'by-priority') {
      out.sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
    return out;
  }, [items, filter]);

  const grouped = useMemo(() => ({
    task: filteredItems.filter(i => i.type === 'task'),
    output: filteredItems.filter(i => i.type === 'output'),
    goal: filteredItems.filter(i => i.type === 'goal'),
  }), [filteredItems]);

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all-overdue', label: 'All Overdue' },
    { key: 'last-30-days', label: 'Last 30 Days' },
    { key: 'by-priority', label: 'By Priority' },
    { key: 'sales', label: 'Sales' },
    { key: 'goals', label: 'Goals' },
  ];

  const priorityBadge = (p?: string) => {
    if (!p) return null;
    const styles = p === 'High' ? 'bg-red-100 text-red-800'
      : p === 'Medium' ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800';
    return <Badge className={`text-xs ${styles}`}>{p}</Badge>;
  };

  const typeIcon = (t: OverdueEntry['type']) => {
    if (t === 'task') return <CheckSquare className="h-4 w-4 text-red-500" />;
    if (t === 'output') return <FileText className="h-4 w-4 text-orange-500" />;
    return <Target className="h-4 w-4 text-purple-500" />;
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Panel
            </CardTitle>
            <CardDescription>Everything past due, in one place</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <Button
                key={f.key}
                size="sm"
                variant={filter === f.key ? 'default' : 'outline'}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading overdue items…</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing overdue. Nice work.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['task', 'output', 'goal'] as const).map(section => (
              <div key={section} className="space-y-2">
                <h4 className="text-sm font-semibold capitalize flex items-center gap-1">
                  {typeIcon(section)} {section}s ({grouped[section].length})
                </h4>
                <div className="space-y-2">
                  {grouped[section].length === 0 && (
                    <p className="text-xs text-muted-foreground">None.</p>
                  )}
                  {grouped[section].map(item => (
                    <div key={item.id} className="p-2 rounded-md border bg-muted/30 text-sm space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{item.title}</span>
                        {priorityBadge(item.priority)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Due {format(item.dueDate, 'MMM d')}</span>
                        <span className="text-red-600 font-medium">{item.daysOverdue}d late</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
