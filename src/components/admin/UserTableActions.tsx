import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/userTypes';
import { Trash2, Eye, Edit, UserCheck, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface UserTableActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onActivateUser?: (userId: string) => void;
  onLifecycleChange?: () => void; // refresh after archive/delete/unarchive
}

export const UserTableActions = ({ user, onEdit, onDelete, onActivateUser, onLifecycleChange }: UserTableActionsProps) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isArchived = (user as any).isArchived === true;

  const callLifecycle = async (action: 'archive' | 'unarchive' | 'delete') => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-lifecycle', {
        body: { action, targetUserId: user.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if (action === 'archive') toast.success(`${user.name} archived — sign-in blocked.`);
      if (action === 'unarchive') toast.success(`${user.name} unarchived.`);
      if (action === 'delete') {
        const d: any = data;
        toast.success(
          `${user.name} deleted. ${d?.reassignedGoals ?? 0} goal(s) reassigned; ${d?.notifiedManagers ?? 0} manager(s) notified.`
        );
      }
      onLifecycleChange?.();
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${action} user`);
    } finally {
      setBusy(false);
    }
  };

  const handleShowPassword = (user: User) => {
    if (user.userStatus === 'pending' && user.temporaryPassword) {
      toast.info(`Temporary password: ${user.temporaryPassword}`, {
        duration: 10000,
        description: 'Password will be cleared after first login',
      });
    } else if (user.userStatus === 'pending') {
      toast.info('No temporary password set for this user');
    } else {
      toast.info('User has changed their password from the default');
    }
  };

  return (
    <div className="text-right space-x-2">
      <Button variant="outline" size="sm" onClick={() => onEdit(user)} disabled={busy}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleShowPassword(user)} disabled={busy}>
        <Eye className="h-4 w-4" />
      </Button>
      {user.userStatus === 'pending' && onActivateUser && (
        <Button variant="default" size="sm" onClick={() => onActivateUser(user.id)} disabled={busy}>
          <UserCheck className="h-4 w-4" />
        </Button>
      )}
      {isArchived ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => callLifecycle('unarchive')}
          disabled={busy}
          title="Unarchive user (restores sign-in)"
        >
          <ArchiveRestore className="h-4 w-4 text-emerald-600" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => callLifecycle('archive')}
          disabled={busy}
          title="Archive user (blocks sign-in)"
        >
          <Archive className="h-4 w-4 text-amber-600" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmDeleteOpen(true)}
        disabled={busy}
        title="Delete user (reassigns their data to you)"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the user. All goals, tasks, and weekly outputs they own
              will be <strong>reassigned to you</strong>, and every manager will get an
              orphan notification for each reassigned goal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setConfirmDeleteOpen(false);
                callLifecycle('delete');
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete &amp; Notify Managers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
