
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

interface CreateUserRequest {
  name: string
  email: string
  role: 'admin' | 'manager' | 'team-member'
  position?: string
  temporaryPassword: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, email, role, position, temporaryPassword }: CreateUserRequest = await req.json()

    console.log('Creating user with email:', email)

    // Create the auth user first
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        position
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user account: ' + authError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!authData.user) {
      console.error('No user data returned from auth creation')
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()

    let profileError = null

    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing profile for user:', email)
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          name,
          email,
          role,
          position: position || null,
          temporary_password: temporaryPassword,
          user_status: 'pending',
          has_changed_password: false
        })
        .eq('id', authData.user.id)

      profileError = error
    } else {
      // Create new profile
      console.log('Creating new profile for user:', email)
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
          position: position || null,
          temporary_password: temporaryPassword,
          user_status: 'pending',
          has_changed_password: false
        })

      profileError = error
    }

    if (profileError) {
      console.error('Error creating/updating profile:', profileError)
      // If profile creation/update fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile: ' + profileError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User created successfully:', authData.user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email,
          name,
          role,
          position,
          temporaryPassword
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
