import { Badge } from '@/components/ui/badge';
import { Globe, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisibilityBadgeProps {
  visibility?: 'all' | 'managers' | 'self';
  className?: string;
}

const STYLES = {
  all: {
    label: 'Public',
    icon: Globe,
    classes: 'bg-green-100 text-green-800 border-green-300',
  },
  managers: {
    label: 'Managers',
    icon: Shield,
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  self: {
    label: 'Private',
    icon: Lock,
    classes: 'bg-slate-200 text-slate-800 border-slate-300',
  },
} as const;

export const VisibilityBadge = ({ visibility = 'all', className }: VisibilityBadgeProps) => {
  const style = STYLES[visibility] ?? STYLES.all;
  const Icon = style.icon;
  return (
    <Badge
      variant="outline"
      className={cn('text-xs flex items-center gap-1 border', style.classes, className)}
      title={`Visibility: ${style.label}`}
    >
      <Icon className="h-3 w-3" />
      {style.label}
    </Badge>
  );
};
