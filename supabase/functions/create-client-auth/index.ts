import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { client_id, email, phone, name } = await req.json()

    if (!client_id || !email) {
      return new Response(JSON.stringify({ error: 'client_id and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Creating auth user for client:', { client_id, email, name })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if auth user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let authUserId: string

    if (existingUser) {
      console.log('Auth user already exists:', existingUser.id)
      authUserId = existingUser.id
    } else {
      // Create the auth user with default password "Welcome@Rook"
      const defaultPassword = 'Welcome@Rook'
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          name: name || email,
          phone: phone || '',
          client_id: client_id
        }
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        return new Response(JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      authUserId = authUser.user!.id
      console.log('Auth user created:', authUserId)
    }

    // Link the auth user to client_users table
    const { data: clientUserData, error: clientUserError } = await supabaseAdmin
      .from('client_users')
      .upsert({
        id: authUserId,
        client_id: client_id,
        email: email,
        password_changed: false
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (clientUserError) {
      console.error('Client user link error:', clientUserError)
      return new Response(JSON.stringify({ error: `Failed to link auth user: ${clientUserError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Client user linked successfully:', clientUserData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        auth_user_id: authUserId,
        client_user: clientUserData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

