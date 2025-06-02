
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface DeleteUserRequest {
  userIds?: string[]
  emails?: string[]
  deleteAllNonAdmins?: boolean
}

interface DeleteResult {
  userId: string
  email: string
  success: boolean
  error?: string
}

Deno.serve(async (req) => {
  console.log(`Received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse the request body first
    const requestBody = await req.json()
    console.log('Request body:', requestBody);

    // Verify the request is from an authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract JWT token and verify admin status
    const token = authHeader.replace('Bearer ', '')
    console.log('Verifying user token...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User authenticated:', user.email);

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profile || profile.role !== 'admin') {
      console.error('User is not admin:', user.email, 'Role:', profile?.role)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Admin access verified for:', user.email);

    const { userIds, emails, deleteAllNonAdmins }: DeleteUserRequest = requestBody
    const results: DeleteResult[] = []

    if (deleteAllNonAdmins) {
      console.log('Deleting all non-admin users...')
      
      // Get all non-admin users from profiles
      const { data: nonAdminProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .neq('role', 'admin')

      if (profilesError) {
        console.error('Error fetching non-admin profiles:', profilesError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch non-admin users' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`Found ${nonAdminProfiles?.length || 0} non-admin users to delete`);

      // Delete each non-admin user
      for (const profile of nonAdminProfiles || []) {
        const result = await deleteUser(profile.id, profile.email)
        results.push(result)
      }
    } else {
      // Handle specific user IDs or emails
      const usersToDelete: Array<{ id: string; email: string }> = []

      if (userIds && userIds.length > 0) {
        console.log('Fetching users by IDs:', userIds);
        // Get user details for the provided IDs
        const { data: userProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .in('id', userIds)

        if (userProfiles) {
          usersToDelete.push(...userProfiles)
        }
      }

      if (emails && emails.length > 0) {
        console.log('Fetching users by emails:', emails);
        // Get user details for the provided emails
        const { data: userProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .in('email', emails)

        if (userProfiles) {
          usersToDelete.push(...userProfiles)
        }
      }

      console.log(`Found ${usersToDelete.length} users to delete`);

      // Delete each specified user
      for (const userToDelete of usersToDelete) {
        const result = await deleteUser(userToDelete.id, userToDelete.email)
        results.push(result)
      }
    }

    console.log(`Deletion completed. Results:`, results)

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        deletedCount: results.filter(r => r.success).length,
        failedCount: results.filter(r => !r.success).length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function deleteUser(userId: string, email: string): Promise<DeleteResult> {
  try {
    console.log(`Attempting to delete user: ${email} (${userId})`)

    // First, delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error(`Error deleting profile for ${email}:`, profileError)
      return {
        userId,
        email,
        success: false,
        error: `Failed to delete profile: ${profileError.message}`
      }
    }

    console.log(`Profile deleted for: ${email}`);

    // Then, delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error(`Error deleting auth user for ${email}:`, authError)
      return {
        userId,
        email,
        success: false,
        error: `Failed to delete auth user: ${authError.message}`
      }
    }

    console.log(`Successfully deleted user: ${email}`)
    return {
      userId,
      email,
      success: true
    }

  } catch (error) {
    console.error(`Unexpected error deleting user ${email}:`, error)
    return {
      userId,
      email,
      success: false,
      error: `Unexpected error: ${error.message}`
    }
  }
}
