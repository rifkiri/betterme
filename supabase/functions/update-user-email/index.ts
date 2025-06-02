
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or newEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('Updating email for user:', userId, 'to:', newEmail);

    // Update email in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail
    });

    if (error) {
      console.error('Error updating email in auth:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Successfully updated email in auth system');
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Failed to update email:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update email in authentication system' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
