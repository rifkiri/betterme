// Admin-only edge function to archive or delete users
// - archive: mark profile is_archived + ban auth user
// - delete: reassign owned goals/tasks/outputs to the acting admin, notify
//   managers via goal_notifications, then delete auth user (cascades profile)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  action: 'archive' | 'unarchive' | 'delete';
  targetUserId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Admin client (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller identity + admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ error: 'Invalid session' }, 401);
    }
    const callerId = userData.user.id;

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('id, role, name')
      .eq('id', callerId)
      .single();
    if (profileError || !callerProfile) {
      return json({ error: 'Caller profile not found' }, 403);
    }
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'manager') {
      return json({ error: 'Forbidden: admin/manager role required' }, 403);
    }

    const body = (await req.json()) as RequestBody;
    if (!body || !body.action || !body.targetUserId) {
      return json({ error: 'Missing action or targetUserId' }, 400);
    }
    if (body.targetUserId === callerId) {
      return json({ error: 'You cannot archive or delete yourself' }, 400);
    }

    if (body.action === 'archive' || body.action === 'unarchive') {
      const isArchive = body.action === 'archive';
      const { error: updErr } = await admin
        .from('profiles')
        .update({
          is_archived: isArchive,
          archived_at: isArchive ? new Date().toISOString() : null,
          archived_by: isArchive ? callerId : null,
        })
        .eq('id', body.targetUserId);
      if (updErr) return json({ error: `Profile update failed: ${updErr.message}` }, 500);

      // Ban / unban via admin API. `ban_duration` accepts strings like "876000h"
      // (~100 years) for indefinite bans, or "none" to lift the ban.
      const { error: banErr } = await admin.auth.admin.updateUserById(body.targetUserId, {
        ban_duration: isArchive ? '876000h' : 'none',
      } as any);
      if (banErr) {
        console.error('Auth ban failed:', banErr);
        return json({ error: `Auth ban failed: ${banErr.message}` }, 500);
      }

      return json({ success: true, action: body.action });
    }

    if (body.action === 'delete') {
      // Reassign owned records to the caller admin
      const reassignPatch = { user_id: callerId };

      // Fetch goals we're about to reassign so we can notify managers
      const { data: goalsToReassign } = await admin
        .from('goals')
        .select('id, title')
        .eq('user_id', body.targetUserId)
        .eq('is_deleted', false);

      const { error: gErr } = await admin.from('goals').update(reassignPatch).eq('user_id', body.targetUserId);
      if (gErr) return json({ error: `Goal reassign failed: ${gErr.message}` }, 500);

      const { error: tErr } = await admin.from('tasks').update(reassignPatch).eq('user_id', body.targetUserId);
      if (tErr) return json({ error: `Task reassign failed: ${tErr.message}` }, 500);

      const { error: oErr } = await admin.from('weekly_outputs').update(reassignPatch).eq('user_id', body.targetUserId);
      if (oErr) return json({ error: `Output reassign failed: ${oErr.message}` }, 500);

      // Fetch managers + admins so we can drop orphan notifications
      const { data: managers } = await admin
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'manager']);

      const managerIds = (managers || []).map((m) => m.id);
      if (managerIds.length > 0 && (goalsToReassign || []).length > 0) {
        const notifRows: any[] = [];
        for (const g of goalsToReassign!) {
          for (const mid of managerIds) {
            notifRows.push({
              user_id: mid,
              goal_id: g.id,
              notification_type: 'orphaned_goal',
              role: 'member',
              acknowledged: false,
            });
          }
        }
        // Best effort — don't fail the whole delete if notifications insert errors.
        const { error: nErr } = await admin.from('goal_notifications').insert(notifRows);
        if (nErr) console.error('Orphan notification insert failed:', nErr);
      }

      // Finally, delete the auth user (cascades to profile)
      const { error: delErr } = await admin.auth.admin.deleteUser(body.targetUserId);
      if (delErr) {
        console.error('Auth deleteUser failed:', delErr);
        return json({ error: `Auth delete failed: ${delErr.message}` }, 500);
      }

      return json({
        success: true,
        action: 'delete',
        reassignedGoals: (goalsToReassign || []).length,
        notifiedManagers: managerIds.length,
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('admin-user-lifecycle error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
