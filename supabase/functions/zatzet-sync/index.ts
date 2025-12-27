import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZatzetInitiativeOwner {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface ZatzetInitiativeKeyResult {
  id: string;
  title: string;
  progress: number;
  status: string;
}

interface ZatzetInitiativeSupporterProfile {
  id?: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface ZatzetInitiativeSupporter {
  id: string;
  user_id: string;
  profile: ZatzetInitiativeSupporterProfile;
}

interface ZatzetInitiative {
  id: string;
  title: string;
  description?: string;
  status?: string;
  progress?: number;
  priority?: string;
  start_date?: string;
  due_date?: string;
  owner?: ZatzetInitiativeOwner;
  key_result?: ZatzetInitiativeKeyResult;
  supporters?: ZatzetInitiativeSupporter[];
  // Legacy fields
  target_date?: string;
  key_result_id?: string;
}

interface RequestBody {
  action: 'test-connection' | 'fetch-initiatives' | 'import-initiatives';
  apiEndpoint: string;
  apiKey: string;
  initiativeIds?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Manager role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { action, apiEndpoint, apiKey } = body;

    console.log(`Zatzet sync action: ${action} for user ${user.id}`);

    switch (action) {
      case 'test-connection': {
        try {
          const response = await fetch(`${apiEndpoint}/v1/initiatives`, {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Zatzet API error:', response.status, errorText);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `API returned ${response.status}: ${errorText}` 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Connection successful' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Connection test failed:', error);
          return new Response(
            JSON.stringify({ success: false, error: `Connection failed: ${error.message}` }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'fetch-initiatives': {
        try {
          const response = await fetch(`${apiEndpoint}/v1/initiatives`, {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch initiatives:', response.status, errorText);
            return new Response(
              JSON.stringify({ success: false, error: `Failed to fetch: ${errorText}` }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const data = await response.json();
          console.log(`Fetched ${data.data?.length || 0} initiatives from Zatzet`);

          return new Response(
            JSON.stringify({ success: true, initiatives: data.data || [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Fetch initiatives failed:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'import-initiatives': {
        const { initiativeIds } = body;
        
        if (!initiativeIds || initiativeIds.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No initiatives selected for import' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          // Get connection ID for logging
          const { data: connection } = await supabase
            .from('integration_connections')
            .select('id')
            .eq('user_id', user.id)
            .eq('integration_type', 'zatzet_okr')
            .maybeSingle();

          const importResults: Array<{ initiativeId: string; goalId?: string; success: boolean; error?: string }> = [];

          for (const initiativeId of initiativeIds) {
            try {
              // Fetch initiative with supporters
              const response = await fetch(`${apiEndpoint}/v1/initiatives/${initiativeId}?include=supporters`, {
                method: 'GET',
                headers: {
                  'x-api-key': apiKey,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                importResults.push({ initiativeId, success: false, error: 'Failed to fetch initiative details' });
                continue;
              }

              const initiativeData = await response.json();
              const initiative: ZatzetInitiative = initiativeData.data || initiativeData;

              // Check if already imported
              const { data: existingLog } = await supabase
                .from('integration_sync_logs')
                .select('internal_id')
                .eq('external_id', initiative.id)
                .eq('sync_type', 'initiative')
                .eq('sync_status', 'success')
                .maybeSingle();

              let goalId: string;
              let isUpdate = false;

              if (existingLog?.internal_id) {
                // Update existing goal instead of skipping
                goalId = existingLog.internal_id;
                isUpdate = true;

                const { error: updateError } = await supabase
                  .from('goals')
                  .update({
                    title: initiative.title,
                    description: initiative.description || `Imported from Zatzet OKR Initiative: ${initiative.id}`,
                    deadline: initiative.due_date || initiative.target_date || null,
                    progress: initiative.progress || 0,
                    completed: initiative.status === 'completed',
                    subcategory: 'okr', // Ensure OKR subcategory is set
                    archived: false, // Unarchive to make visible in marketplace
                    is_deleted: false,
                  })
                  .eq('id', goalId);

                if (updateError) {
                  console.error('Failed to update existing goal:', updateError);
                  importResults.push({ initiativeId: initiative.id, success: false, error: updateError.message });
                  continue;
                }

                console.log(`Updated existing goal ${goalId} from initiative ${initiative.id}`);
              } else {
                // Create new goal from initiative with OKR subcategory
                const { data: newGoal, error: goalError } = await supabase
                  .from('goals')
                  .insert({
                    user_id: user.id,
                    created_by: user.id,
                    title: initiative.title,
                    description: initiative.description || `Imported from Zatzet OKR Initiative: ${initiative.id}`,
                    deadline: initiative.due_date || initiative.target_date || null,
                    progress: initiative.progress || 0,
                    completed: initiative.status === 'completed',
                    category: 'work',
                    subcategory: 'okr', // OKR subcategory for Zatzet initiatives
                    visibility: 'all', // Visible in marketplace
                    archived: false,
                    is_deleted: false,
                  })
                  .select('id')
                  .single();

                if (goalError) {
                  console.error('Failed to create goal:', goalError);
                  importResults.push({ initiativeId: initiative.id, success: false, error: goalError.message });
                  continue;
                }

                goalId = newGoal.id;

                // Log the sync for new imports only
                await supabase
                  .from('integration_sync_logs')
                  .insert({
                    connection_id: connection?.id,
                    sync_type: 'initiative',
                    external_id: initiative.id,
                    internal_id: goalId,
                    sync_status: 'success',
                    sync_direction: 'import',
                  });

                console.log(`Imported initiative ${initiative.id} as new goal ${goalId}`);
              }

              // Create goal assignments for owner and supporters
              let ownerAssigned = false;
              let supportersAssigned = 0;

              // Assign owner as lead if email matches a profile
              if (initiative.owner?.email) {
                const { data: ownerProfile } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('email', initiative.owner.email)
                  .maybeSingle();

                if (ownerProfile) {
                  const { error: ownerAssignError } = await supabase.rpc('create_goal_assignment', {
                    p_goal_id: goalId,
                    p_user_id: ownerProfile.id,
                    p_role: 'lead',
                    p_assigned_by: user.id,
                    p_self_assigned: false,
                  });

                  if (ownerAssignError) {
                    console.error(`Failed to assign owner ${initiative.owner.email}:`, ownerAssignError);
                  } else {
                    ownerAssigned = true;
                    console.log(`Assigned owner ${initiative.owner.email} as lead for goal ${goalId}`);
                  }
                } else {
                  console.log(`Owner email ${initiative.owner.email} not found in profiles`);
                }
              }

              // Assign supporters as members
              if (initiative.supporters && initiative.supporters.length > 0) {
                for (const supporter of initiative.supporters) {
                  const supporterEmail = supporter.profile?.email;
                  if (!supporterEmail) continue;

                  const { data: supporterProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', supporterEmail)
                    .maybeSingle();

                  if (supporterProfile) {
                    const { error: supporterAssignError } = await supabase.rpc('create_goal_assignment', {
                      p_goal_id: goalId,
                      p_user_id: supporterProfile.id,
                      p_role: 'member',
                      p_assigned_by: user.id,
                      p_self_assigned: false,
                    });

                    if (supporterAssignError) {
                      console.error(`Failed to assign supporter ${supporterEmail}:`, supporterAssignError);
                    } else {
                      supportersAssigned++;
                      console.log(`Assigned supporter ${supporterEmail} as member for goal ${goalId}`);
                    }
                  } else {
                    console.log(`Supporter email ${supporterEmail} not found in profiles`);
                  }
                }
              }

              console.log(`Goal ${goalId}: Owner assigned: ${ownerAssigned}, Supporters assigned: ${supportersAssigned}${isUpdate ? ' (updated)' : ' (new)'}`);

              importResults.push({ initiativeId: initiative.id, goalId: goalId, success: true });

            } catch (error) {
              console.error(`Error importing initiative ${initiativeId}:`, error);
              importResults.push({ initiativeId, success: false, error: error.message });
            }
          }

          // Update last sync time
          if (connection?.id) {
            await supabase
              .from('integration_connections')
              .update({ last_sync_at: new Date().toISOString() })
              .eq('id', connection.id);
          }

          const successCount = importResults.filter(r => r.success).length;
          console.log(`Import complete: ${successCount}/${initiativeIds.length} successful`);

          return new Response(
            JSON.stringify({ 
              success: true, 
              results: importResults,
              summary: { total: initiativeIds.length, success: successCount }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Import initiatives failed:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
