import { db, ensureTablesExist, whiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { projectId, elements, files, appState, base64ImagePreview } = await req.json();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project information missing' }, { status: 400 });
    }

    const result = await db.insert(whiteboardData).values({
      projectId: projectId,
      elements: elements,
      appState: appState,
      files: files,
      previewImage: base64ImagePreview
    }).onConflictDoUpdate({
      target: whiteboardData.projectId,
      set: {
        elements: elements,
        appState: appState,
        files: files,
        previewImage: base64ImagePreview,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Failed to save whiteboard:', e);
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}