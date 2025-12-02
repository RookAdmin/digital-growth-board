import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lead_id, email, phone, name } = await req.json()

    console.log('=== CREATE LEAD AUTH REQUEST ===')
    console.log('Request body:', { lead_id, email, phone, name })

    if (!lead_id || !email) {
      console.error('Missing required fields:', { lead_id, email })
      return new Response(JSON.stringify({ error: 'lead_id and email are required' }), {
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

    // Check if auth user already exists by email or phone
    console.log('Checking for existing auth user...')
    const { data: existingUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError)
    }

    // Check for existing user by email (case-insensitive)
    const existingUserByEmail = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    // Check for existing user by phone (if phone provided)
    const existingUserByPhone = phone 
      ? existingUsers?.users?.find(u => u.phone === phone)
      : null

    const existingUser = existingUserByEmail || existingUserByPhone

    if (existingUser) {
      console.log('Auth user already exists:', existingUser.id, existingUser.email)
      // Link to lead_users table if not already linked
      const { data: existingLeadUser, error: checkLeadUserError } = await supabaseAdmin
        .from('lead_users')
        .select('*')
        .eq('id', existingUser.id)
        .maybeSingle()

      if (checkLeadUserError && checkLeadUserError.code !== 'PGRST116') {
        console.error('Error checking lead_users:', checkLeadUserError)
      }

      if (!existingLeadUser) {
        // Link existing auth user to lead_users
        const { error: linkError } = await supabaseAdmin
          .from('lead_users')
          .upsert({
            id: existingUser.id,
            lead_id: lead_id,
            email: email.toLowerCase().trim(),
            password_changed: false
          }, {
            onConflict: 'id'
          })

        if (linkError) {
          console.error('Error linking to lead_users:', linkError)
          return new Response(JSON.stringify({ 
            error: `Failed to link auth user: ${linkError.message}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        console.log('Linked existing auth user to lead')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auth user already exists and linked',
          auth_user_id: existingUser.id,
          is_existing: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create new auth user
    console.log('Creating new auth user...')
    const defaultPassword = 'Welcome@Rook'
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        name: name || email,
        phone: phone || '',
        lead_id: lead_id
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

    const authUserId = authUser.user.id
    console.log('Auth user created successfully:', authUserId)

    // Link to lead_users table
    console.log('Linking auth user to lead_users table...')
    const { data: leadUserData, error: leadUserError } = await supabaseAdmin
      .from('lead_users')
      .upsert({
        id: authUserId,
        lead_id: lead_id,
        email: email.toLowerCase().trim(),
        password_changed: false
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (leadUserError) {
      console.error('Lead user link error:', leadUserError)
      return new Response(JSON.stringify({ 
        error: `Failed to link auth user: ${leadUserError.message}`,
        details: leadUserError
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('=== SUCCESS ===')
    console.log('Lead user linked successfully:', leadUserData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead auth user created and linked successfully',
        auth_user_id: authUserId,
        lead_user: leadUserData,
        default_password: 'Welcome@Rook',
        is_existing: false
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

