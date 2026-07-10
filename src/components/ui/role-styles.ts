import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UserCog, UserCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AssignmentRole = 'coach' | 'lead' | 'member';

export const ROLE_STYLES: Record<AssignmentRole, { badge: string; icon: string; label: string }> = {
  coach:  { badge: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',             icon: 'text-blue-600',    label: 'Coach'  },
  lead:   { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100', icon: 'text-emerald-600', label: 'Lead'   },
  member: { badge: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',     icon: 'text-purple-600',  label: 'Member' },
};

const ROLE_ICON = {
  coach: UserCog,
  lead: UserCheck,
  member: Users,
} as const;

interface RoleTagProps {
  role: AssignmentRole;
  count?: number;
  className?: string;
}

export const RoleTag = ({ role, count, className }: RoleTagProps) => {
  const style = ROLE_STYLES[role];
  const Icon = ROLE_ICON[role];
  if (!style) return null;
  return (
    <Badge
      className={cn('text-xs gap-1 border font-medium', style.badge, className)}
      title={`Role: ${style.label}`}
    >
      <Icon className={cn('h-3 w-3', style.icon)} />
      {style.label}{typeof count === 'number' ? ` (${count})` : ''}
    </Badge>
  );
};
