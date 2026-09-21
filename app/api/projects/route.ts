import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, whiteboardData } from "@/db/schema";

export async function POST(request: NextRequest) {
  const { projectId, projectName } = await request.json();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!projectId || !projectName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const result = await db
    .insert(projects)
    .values({ projectId, projectName, userEmail: email })
    .returning();

  return NextResponse.json(result[0]);
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!projectId) {
    return NextResponse.json({ error: "Project information missing" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const userProject = await db
    .select()
    .from(projects)
    .where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));

  if (userProject.length === 0) {
    return NextResponse.json({ error: "Unauthorized user" }, { status: 403 });
  }

  const result = await db
    .select()
    .from(whiteboardData)
    .where(eq(whiteboardData.projectId, projectId));

  return NextResponse.json({...result[0], projectName:userProject[0].projectName});
}
