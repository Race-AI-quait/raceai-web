import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET() {
  try {
    const projects = await dataService.getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProject = await dataService.createProject(body);
    return NextResponse.json(newProject);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
