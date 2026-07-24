import React, { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Search, Target, Package, CheckSquare, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarActivityType = 'goal' | 'output' | 'task';

export interface CalendarActivityItem {
  id: string;
  type: CalendarActivityType;
  title: string;
  description?: string;
  date: Date;
  ownerId?: string;
  ownerName?: string;
  progress?: number;
  priority?: 'Low' | 'Medium' | 'High';
}

interface ActivitiesCalendarViewProps {
  activities: CalendarActivityItem[];
  users?: Array<{ id: string; name: string }>;
  showUserFilter?: boolean;
  title?: string;
}

const TYPE_META: Record<CalendarActivityType, { label: string; icon: React.ComponentType<any>; pill: string; dot: string; emoji: string }> = {
  goal: {
    label: 'Goals',
    icon: Target,
    pill: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
    dot: 'bg-indigo-500',
    emoji: '🎯',
  },
  output: {
    label: 'Outputs',
    icon: Package,
    pill: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
    dot: 'bg-emerald-500',
    emoji: '📦',
  },
  task: {
    label: 'Tasks',
    icon: CheckSquare,
    pill: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
    dot: 'bg-amber-500',
    emoji: '✅',
  },
};

export const ActivitiesCalendarView: React.FC<ActivitiesCalendarViewProps> = ({
  activities,
  users = [],
  showUserFilter = false,
  title = 'Activities Calendar',
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [enabledTypes, setEnabledTypes] = useState<Record<CalendarActivityType, boolean>>({
    goal: true,
    output: true,
    task: true,
  });
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((a) => {
      if (!enabledTypes[a.type]) return false;
      if (userFilter !== 'all' && a.ownerId !== userFilter) return false;
      if (q) {
        const hay = `${a.title} ${a.description ?? ''} ${a.ownerName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activities, enabledTypes, userFilter, search]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarActivityItem[]>();
    for (const a of filtered) {
      if (!a.date) continue;
      const key = format(a.date, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [filtered]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedDayItems = selectedDay
    ? byDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? []
    : [];

  const renderPill = (item: CalendarActivityItem) => {
    const meta = TYPE_META[item.type];
    const suffix =
      item.type === 'task'
        ? item.priority ?? ''
        : typeof item.progress === 'number'
        ? `${item.progress}%`
        : '';
    return (
      <button
        key={`${item.type}-${item.id}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDay(item.date);
        }}
        className={cn(
          'w-full truncate text-left rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition',
          meta.pill
        )}
        title={`${meta.emoji} ${item.title}${suffix ? ` — ${suffix}` : ''}`}
      >
        <span className="mr-1">{meta.emoji}</span>
        <span className="truncate">{item.title}</span>
        {suffix && <span className="ml-1 opacity-70">· {suffix}</span>}
      </button>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center text-sm font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
                Today
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(TYPE_META) as CalendarActivityType[]).map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            return (
              <Toggle
                key={t}
                pressed={enabledTypes[t]}
                onPressedChange={(v) => setEnabledTypes((prev) => ({ ...prev, [t]: v }))}
                size="sm"
                className="gap-1"
                aria-label={`Toggle ${meta.label}`}
              >
                <span className={cn('inline-block h-2 w-2 rounded-full', meta.dot)} />
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </Toggle>
            );
          })}

          <div className="relative ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, owner…"
                className="h-8 w-48 pl-7 text-xs"
              />
            </div>
            {showUserFilter && users.length > 0 && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-muted/60 px-2 py-1.5 text-center font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {gridDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const items = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const showItems = items.slice(0, 3);
            const extra = items.length - showItems.length;
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'flex min-h-[92px] flex-col gap-1 bg-background p-1.5 text-left transition hover:bg-accent/40',
                  !inMonth && 'bg-muted/30 text-muted-foreground'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                      isToday(day) && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {showItems.map((i) => renderPill(i))}
                  {extra > 0 && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground">
                      +{extra} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? format(selectedDay, 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {selectedDayItems.length === 0 && (
              <p className="text-sm text-muted-foreground">No activities scheduled for this day.</p>
            )}
            {selectedDayItems.map((item) => {
              const meta = TYPE_META[item.type];
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-md border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className={cn('inline-block h-2 w-2 rounded-full', meta.dot)} />
                        {meta.emoji} {meta.label.slice(0, -1)}
                        {item.ownerName && <span>· {item.ownerName}</span>}
                      </div>
                      <div className="mt-0.5 truncate font-medium">{item.title}</div>
                      {item.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {item.type === 'task' && item.priority && (
                        <Badge variant="outline">{item.priority}</Badge>
                      )}
                      {item.type !== 'task' && typeof item.progress === 'number' && (
                        <Badge variant="outline">{item.progress}%</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ActivitiesCalendarView;
