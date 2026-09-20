import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projects } from '@/db/schema';

export async function POST(request: NextRequest) {
  const { projectId, projectName } = await request.json();
  const user = await currentUser();

  if (!projectId || !projectName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const email = user?.primaryEmailAddress?.emailAddress;

  if(!user?.primaryEmailAddress?.emailAddress){
    return NextResponse.json({error:'project Information missing'})
  }

  if (!email) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const result = await db
    .insert(projects)
    .values({
      projectId,
      projectName,
      userEmail: email,
    })
    .returning();

  return NextResponse.json(result[0]);
}