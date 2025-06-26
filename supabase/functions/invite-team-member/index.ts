
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

    console.log('Sending invitation to:', email)

    // First, create the team member record with a temporary user_id
    const tempUserId = crypto.randomUUID()
    
    const { error: insertError } = await supabaseAdmin.from('team_members').insert({
      user_id: tempUserId,
      email,
      name,
      role,
      invited_by: inviter.id,
      is_active: false,
    })

    console.log('Insert result:', { insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // Try to send the invitation
    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { 
          name,
          role,
          temp_user_id: tempUserId
        },
        redirectTo: `${req.headers.get('origin') || 'https://preview--digital-growth-board.lovable.app'}/dashboard/team`
      })
      
      console.log('Invite result:', { inviteData, inviteError })
      
      if (inviteError) {
        console.error('Invite error:', inviteError)
        // Don't throw here, the team member record is still created
        console.log('Invitation email failed, but team member record created')
      } else if (inviteData.user) {
        // Update the team member record with the real user ID
        await supabaseAdmin.from('team_members')
          .update({ user_id: inviteData.user.id })
          .eq('user_id', tempUserId)
        console.log('Updated team member record with real user ID')
      }
    } catch (emailError) {
      console.error('Email invitation failed:', emailError)
      // Continue - the team member record is still created
    }

    console.log('Team member added successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Team member added successfully. They will need to sign up using the provided email address.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
