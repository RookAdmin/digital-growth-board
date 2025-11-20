
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, role, defaultPassword } = await req.json()

    console.log('Invite request:', { email, name, role })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user: inviter } } = await supabase.auth.getUser()

    if (!inviter) {
      console.log('User not authenticated')
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('Inviter user ID:', inviter.id)
    
    // Check if inviter is an admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('user_id', inviter.id)
      .single()

    console.log('Admin check result:', { adminProfile, adminError })

    if (adminError || !adminProfile || adminProfile.role !== 'Admin') {
      console.log('User is not admin:', { adminError, adminProfile })
      return new Response(JSON.stringify({ error: 'Only admins can invite new members.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Creating auth user for:', email)

    // Create the auth user with minimal required fields to avoid the email_change issue
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { 
        name, 
        role,
        full_name: name
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(JSON.stringify({ error: `Failed to create user: ${authError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Auth user created:', authUser.user?.id)

    // Create the team member record
    const { data: teamMemberData, error: insertError } = await supabaseAdmin
      .from('team_members')
      .insert({
        user_id: authUser.user!.id,
        email,
        name,
        role,
        invited_by: inviter.id,
        is_active: true,
        joined_at: new Date().toISOString(),
        default_password: defaultPassword,
        password_changed: false,
      })
      .select()
      .single()

    console.log('Team member insert result:', { teamMemberData, insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      
      // If team member creation fails, clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
        console.log('Cleaned up auth user due to team member creation failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      return new Response(JSON.stringify({ error: `Failed to create team member: ${insertError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Team member record created successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Team member added successfully. They can now log in with the provided credentials.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
