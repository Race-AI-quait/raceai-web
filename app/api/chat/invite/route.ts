import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const { email, chatId } = await req.json();

    if (!email || !chatId) {
      return NextResponse.json({ error: "Missing email or chatId" }, { status: 400 });
    }

    // Simulate sending an invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/jarvis?sessionId=${chatId}`;
    
    // In a real app, we would store this invite in DB. 
    // Here we just use the email service to log/send it.
    
    // We repurpose the 'sendVerificationEmail' or create a new helper if strict.
    // Since 'sendVerificationEmail' takes (email, code), we can pass the link as code or just modify the service.
    // For minimal disruption, we'll just log it here or use the service if it's flexible.
    
    // Let's assume we can use the service to "mock" sending ANY content if we tweaked it, 
    // but looking at `emailService.js`, it logs "Your verification code is: ...".
    // That's fine for testing flows.
    
    await sendVerificationEmail(email, `Invite to Chat: ${inviteLink}`);

    return NextResponse.json({ success: true, message: "Invite sent" });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
