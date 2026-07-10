import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisibilityBadge } from '@/components/ui/visibility-badge';
import { RoleTag, AssignmentRole } from '@/components/ui/role-styles';
import { useOwnerName } from '@/hooks/useOwnerName';

interface CardMetaStripProps {
  ownerId?: string | null;
  /** Skip the owner tag when this equals ownerId (e.g. current user's own card). */
  hideOwnerIfSelf?: string | null;
  role?: AssignmentRole | null;
  visibility?: 'all' | 'managers' | 'self';
  className?: string;
}

const OwnerTag = ({ ownerId }: { ownerId: string }) => {
  const { name } = useOwnerName(ownerId);
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs flex items-center gap-1 border bg-slate-50 text-slate-700 border-slate-200'
      )}
      title={`Owner: ${name ?? '…'}`}
    >
      <UserIcon className="h-3 w-3 text-slate-500" />
      Owner: {name ?? '…'}
    </Badge>
  );
};

export const CardMetaStrip = ({
  ownerId,
  hideOwnerIfSelf,
  role,
  visibility,
  className,
}: CardMetaStripProps) => {
  const showOwner = !!ownerId && ownerId !== hideOwnerIfSelf;
  if (!showOwner && !role && !visibility) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {showOwner && <OwnerTag ownerId={ownerId!} />}
      {role && <RoleTag role={role} />}
      {visibility && <VisibilityBadge visibility={visibility} />}
    </div>
  );
};
