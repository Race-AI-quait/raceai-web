
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

// Initialize with dummy key for build-time if env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build_purposes');

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'RACE AI <onboarding@resend.dev>', // Update this if you have a custom domain
      to: [email],
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h1>Welcome to RACE AI</h1>
          <p>Your verification code is:</p>
          <h2 style="letter-spacing: 5px; background: #f0f0f0; padding: 10px; display: inline-block; border-radius: 5px;">${code}</h2>
          <p>Enter this code to complete your setup.</p>
        </div>
      `,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
