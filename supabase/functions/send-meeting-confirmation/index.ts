
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MeetingConfirmationRequest {
  slotId: string;
  clientEmail: string;
  clientName: string;
  meetingDateTime: string;
  duration: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { slotId, clientEmail, clientName, meetingDateTime, duration }: MeetingConfirmationRequest = await req.json();

    console.log('Sending meeting confirmation:', { slotId, clientEmail, clientName, meetingDateTime });

    // Here you would integrate with an email service like Resend, SendGrid, etc.
    // For now, we'll log the email content and simulate sending
    
    const emailContent = `
      <h1>Meeting Confirmation</h1>
      <p>Dear ${clientName},</p>
      <p>Your kickoff meeting has been successfully scheduled:</p>
      <ul>
        <li><strong>Date & Time:</strong> ${new Date(meetingDateTime).toLocaleString()}</li>
        <li><strong>Duration:</strong> ${duration} minutes</li>
        <li><strong>Meeting Type:</strong> Kickoff Meeting</li>
      </ul>
      <p>We look forward to discussing your project requirements!</p>
      <p>Best regards,<br>StellarGrowth Team</p>
    `;

    console.log('Email content:', emailContent);

    // Update the meeting slot status
    const { error: updateError } = await supabase
      .from('meeting_slots')
      .update({ 
        status: 'booked',
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId);

    if (updateError) {
      throw new Error(`Failed to update meeting slot: ${updateError.message}`);
    }

    // In a real implementation, you would send the actual email here
    // For demonstration, we'll return success
    
    console.log('Meeting confirmation email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Meeting confirmation sent successfully' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-meeting-confirmation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
