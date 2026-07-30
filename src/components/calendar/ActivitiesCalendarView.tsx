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
  isToday,
} from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Search, Target, Package, CheckSquare, Check } from 'lucide-react';
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
  completed?: boolean;
  /** 'all' | 'managers' | 'self' — 'self' items are hidden unless owned by the viewer */
  visibility?: string;
  /** 'work' | 'personal' — personal items are hidden unless owned by the viewer */
  category?: string;
}

interface ActivitiesCalendarViewProps {
  activities: CalendarActivityItem[];
  users?: Array<{ id: string; name: string }>;
  showUserFilter?: boolean;
  title?: string;
  /** Used for privacy scoping of private / personal items */
  currentUserId?: string;
}

const TYPE_META: Record<
  CalendarActivityType,
  { label: string; singular: string; icon: React.ComponentType<any>; chip: string; dot: string; emoji: string; segment: string }
> = {
  goal: {
    label: 'Goals',
    singular: 'Goal',
    icon: Target,
    chip: 'border-l-4 border-l-indigo-600 bg-indigo-50/90 text-indigo-950 hover:bg-indigo-100',
    dot: 'bg-indigo-600',
    emoji: '🎯',
    segment: 'data-[on=true]:bg-indigo-600 data-[on=true]:text-white data-[on=true]:border-indigo-600',
  },
  output: {
    label: 'Outputs',
    singular: 'Bi-Weekly Output',
    icon: Package,
    chip: 'border-l-4 border-l-emerald-600 bg-emerald-50/90 text-emerald-950 hover:bg-emerald-100',
    dot: 'bg-emerald-600',
    emoji: '📦',
    segment: 'data-[on=true]:bg-emerald-600 data-[on=true]:text-white data-[on=true]:border-emerald-600',
  },
  task: {
    label: 'Tasks',
    singular: 'Task',
    icon: CheckSquare,
    chip: 'border-l-4 border-l-amber-500 bg-amber-50/90 text-amber-950 hover:bg-amber-100',
    dot: 'bg-amber-500',
    emoji: '✅',
    segment: 'data-[on=true]:bg-amber-500 data-[on=true]:text-white data-[on=true]:border-amber-500',
  },
};

const APPLE_FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif' };

export const ActivitiesCalendarView: React.FC<ActivitiesCalendarViewProps> = ({
  activities,
  users = [],
  showUserFilter = false,
  title = 'Activities Calendar',
  currentUserId,
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

  // Privacy scoping: private ('self') or personal items are only visible to their owner.
  const visible = useMemo(() => {
    return activities.filter((a) => {
      const isOwner = !!currentUserId && a.ownerId === currentUserId;
      if (isOwner) return true;
      if (a.visibility === 'self') return false;
      if (a.category === 'personal') return false;
      return true;
    });
  }, [activities, currentUserId]);

  const searchedAndScoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter((a) => {
      if (userFilter !== 'all' && a.ownerId !== userFilter) return false;
      if (q) {
        const hay = `${a.title} ${a.description ?? ''} ${a.ownerName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visible, userFilter, search]);

  const filtered = useMemo(
    () => searchedAndScoped.filter((a) => enabledTypes[a.type]),
    [searchedAndScoped, enabledTypes]
  );

  const monthCounts = useMemo(() => {
    const counts: Record<CalendarActivityType, number> = { goal: 0, output: 0, task: 0 };
    searchedAndScoped.forEach((a) => {
      if (a.date && isSameMonth(a.date, currentMonth)) counts[a.type] += 1;
    });
    return counts;
  }, [searchedAndScoped, currentMonth]);

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

  const groupedSelected = useMemo(() => {
    return (['goal', 'output', 'task'] as CalendarActivityType[])
      .map((t) => ({ type: t, items: selectedDayItems.filter((i) => i.type === t) }))
      .filter((g) => g.items.length > 0);
  }, [selectedDayItems]);

  const renderChip = (item: CalendarActivityItem) => {
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
          'group flex w-full items-center gap-1 rounded-[4px] px-1.5 py-[3px] text-left text-[10px] font-medium leading-tight transition-all hover:-translate-y-[1px] hover:shadow-sm',
          meta.chip
        )}
        title={`${meta.emoji} ${item.title}${suffix ? ` — ${suffix}` : ''}`}
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
        <span className="truncate">{item.title}</span>
        {item.completed && <Check className="ml-auto h-3 w-3 shrink-0 opacity-70" />}
      </button>
    );
  };

  return (
    <Card className="w-full border-border/70 shadow-sm" style={APPLE_FONT}>
      {/* Apple-style glassmorphic control bar */}
      <div className="sticky top-0 z-10 rounded-t-lg border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{format(currentMonth, 'MMMM')}</h2>
            <span className="text-xl font-light tracking-tight text-muted-foreground">
              {format(currentMonth, 'yyyy')}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">· {title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-border/70 bg-muted/40 p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <button
              onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-700"
            >
              Today
            </button>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, owner…"
                className="h-8 w-44 rounded-full pl-7 text-xs"
              />
            </div>
            {showUserFilter && users.length > 0 && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-8 w-40 rounded-full text-xs">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
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

        {/* Segmented category toggles with live monthly counts */}
        <div className="mt-3 inline-flex flex-wrap items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
          {(Object.keys(TYPE_META) as CalendarActivityType[]).map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            const on = enabledTypes[t];
            return (
              <button
                key={t}
                data-on={on}
                onClick={() => setEnabledTypes((prev) => ({ ...prev, [t]: !prev[t] }))}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-medium text-muted-foreground transition',
                  'hover:bg-background/80',
                  meta.segment
                )}
                aria-pressed={on}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-current' : meta.dot)} />
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
                <span className="rounded-full bg-background/70 px-1.5 text-[10px] font-semibold text-foreground/70">
                  {monthCounts[t]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border/70 text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="bg-muted/50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
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
                  'flex min-h-[104px] flex-col gap-1 bg-background p-1.5 text-left transition hover:bg-accent/40',
                  !inMonth && 'bg-muted/30 text-muted-foreground'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      isToday(day) &&
                        'flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-black text-white shadow-md shadow-blue-500/30'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground">{items.length}</span>
                  )}
                </div>
                <div className="flex flex-col gap-[3px]">
                  {showItems.map((i) => renderChip(i))}
                  {extra > 0 && (
                    <span className="px-1 text-[10px] font-medium text-muted-foreground">+{extra} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* Apple sheet day detail */}
      <Sheet open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md" style={APPLE_FONT}>
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              {selectedDay ? format(selectedDay, 'MMMM d') : ''}
            </SheetTitle>
            <SheetDescription>
              {selectedDay ? format(selectedDay, 'EEEE, yyyy') : ''} · {selectedDayItems.length} activit
              {selectedDayItems.length === 1 ? 'y' : 'ies'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 max-h-[80vh] space-y-5 overflow-y-auto pr-1">
            {groupedSelected.length === 0 && (
              <p className="text-sm text-muted-foreground">No activities scheduled for this day.</p>
            )}
            {groupedSelected.map(({ type, items }) => {
              const meta = TYPE_META[type];
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                    {meta.emoji} {meta.label}
                    <span className="text-foreground/60">({items.length})</span>
                  </div>
                  {items.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={cn('rounded-lg p-3 shadow-sm', meta.chip.replace('hover:bg-indigo-100', '').replace('hover:bg-emerald-100', '').replace('hover:bg-amber-100', ''))}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{item.title}</div>
                          {item.description && (
                            <div className="mt-1 line-clamp-2 text-xs opacity-80">{item.description}</div>
                          )}
                        </div>
                        <div className="shrink-0">
                          {item.type === 'task' && item.priority && (
                            <Badge variant="outline" className="bg-background/70 text-[10px]">
                              {item.priority}
                            </Badge>
                          )}
                          {item.completed && <Check className="ml-1 inline h-4 w-4" />}
                        </div>
                      </div>
                      {item.type !== 'task' && typeof item.progress === 'number' && (
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={item.progress} className="h-1.5 flex-1" />
                          <span className="w-10 text-right text-[11px] font-medium">{item.progress}%</span>
                        </div>
                      )}
                      {item.ownerName && (
                        <div className="mt-2">
                          <Badge variant="outline" className="bg-background/70 text-[10px] font-medium">
                            {item.ownerName}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default ActivitiesCalendarView;
