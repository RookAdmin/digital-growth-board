import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { client_id, email, phone, name } = await req.json()

    console.log('=== CREATE CLIENT AUTH REQUEST ===')
    console.log('Request body:', { client_id, email, phone, name })

    if (!client_id || !email) {
      console.error('Missing required fields:', { client_id, email })
      return new Response(JSON.stringify({ error: 'client_id and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration:', { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey })
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Creating Supabase admin client...')
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if client_users entry already exists
    console.log('Checking for existing client_users entry...')
    const { data: existingClientUser, error: checkClientUserError } = await supabaseAdmin
      .from('client_users')
      .select('id, client_id, email')
      .eq('client_id', client_id)
      .maybeSingle()

    if (checkClientUserError && checkClientUserError.code !== 'PGRST116') {
      console.error('Error checking client_users:', checkClientUserError)
    }

    if (existingClientUser) {
      console.log('Client user already exists:', existingClientUser)
      // Verify the auth user exists
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingClientUser.id)
      if (authUser?.user) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Auth user already exists',
            auth_user_id: existingClientUser.id,
            client_user: existingClientUser
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else {
        console.log('Client user exists but auth user missing, will create...')
      }
    }

    // Check if auth user already exists by email
    console.log('Checking for existing auth user by email...')
    const { data: existingUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError)
      // Continue anyway, might be a permission issue
    }

    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    let authUserId: string

    if (existingUser) {
      console.log('Auth user already exists with email:', existingUser.id, existingUser.email)
      authUserId = existingUser.id
    } else {
      // Create the auth user with default password "Welcome@Rook"
      console.log('Creating new auth user...')
      const defaultPassword = 'Welcome@Rook'
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
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
        return new Response(JSON.stringify({ 
          error: `Failed to create auth user: ${authError.message}`,
          details: authError
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!authUser?.user) {
        console.error('Auth user creation returned no user')
        return new Response(JSON.stringify({ error: 'Auth user creation failed: no user returned' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      authUserId = authUser.user.id
      console.log('Auth user created successfully:', authUserId)
    }

    // Link the auth user to client_users table
    console.log('Linking auth user to client_users table...')
    const { data: clientUserData, error: clientUserError } = await supabaseAdmin
      .from('client_users')
      .upsert({
        id: authUserId,
        client_id: client_id,
        email: email.toLowerCase().trim(),
        password_changed: false
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (clientUserError) {
      console.error('Client user link error:', clientUserError)
      return new Response(JSON.stringify({ 
        error: `Failed to link auth user: ${clientUserError.message}`,
        details: clientUserError
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('=== SUCCESS ===')
    console.log('Client user linked successfully:', clientUserData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Client auth user created and linked successfully',
        auth_user_id: authUserId,
        client_user: clientUserData,
        default_password: 'Welcome@Rook'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

