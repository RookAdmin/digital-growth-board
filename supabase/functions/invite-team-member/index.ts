
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

    // Use the admin client to invite user
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { 
        name,
        email_confirm: true
      },
      redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/dashboard/team`
    })
    
    console.log('Invite result:', { inviteData, inviteError })
    
    if (inviteError) {
      console.error('Invite error:', inviteError)
      throw inviteError
    }

    const invitedUser = inviteData.user;
    if (!invitedUser) {
      console.error('No user returned from invite')
      throw new Error("Could not get invited user.")
    }

    console.log('Creating team member record for user:', invitedUser.id)

    const { error: insertError } = await supabaseAdmin.from('team_members').insert({
      user_id: invitedUser.id,
      email,
      name,
      role,
      invited_by: inviter.id,
      is_active: false, // User will be inactive until they accept the invitation
    })

    console.log('Insert result:', { insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    console.log('Invitation sent successfully')

    return new Response(JSON.stringify({ success: true, message: 'Invitation sent successfully' }), {
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
