
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, role } = await req.json()

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

    console.log('Creating team member record for:', email)

    // Create the team member record directly without temporary user_id
    const { data: teamMemberData, error: insertError } = await supabaseAdmin
      .from('team_members')
      .insert({
        email,
        name,
        role,
        invited_by: inviter.id,
        is_active: false,
      })
      .select()
      .single()

    console.log('Team member insert result:', { teamMemberData, insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(JSON.stringify({ error: `Failed to create team member: ${insertError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Team member record created successfully')

    // Try to send the invitation email (optional)
    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { 
          name,
          role,
          team_member_id: teamMemberData.id
        },
        redirectTo: `${req.headers.get('origin') || 'https://preview--digital-growth-board.lovable.app'}/dashboard/team`
      })
      
      console.log('Email invite result:', { inviteData, inviteError })
      
      if (inviteError) {
        console.log('Email invitation failed but team member was created:', inviteError.message)
      }
    } catch (emailError) {
      console.log('Email invitation failed but team member was created:', emailError)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Team member added successfully. They can now sign up using the provided email address.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
