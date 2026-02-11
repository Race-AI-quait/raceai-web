import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    // Use dataService abstraction
    const chats = await dataService.getChats(projectId || undefined);
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Use dataService abstraction
    const newChat = await dataService.createChat({
        ...body,
        // Default values handled by service where possible, or passed through
        owner_id: "user-1", 
        model: body.model || "gpt-4o",
        is_pinned: false
    });
    return NextResponse.json(newChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
