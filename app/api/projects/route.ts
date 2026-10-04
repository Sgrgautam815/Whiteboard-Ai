import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist } from "@/db";
import { projects, whiteboardData } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json().catch(() => ({}));
    const { projectId, projectName } = body;
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!projectId || !projectName) {
      return NextResponse.json({ error: "Missing required fields (projectId, projectName)" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const result = await db
      .insert(projects)
      .values({ projectId, projectName, userEmail: email })
      .returning();

    await db
      .insert(whiteboardData)
      .values({
        projectId,
        elements: [],
        appState: {},
        files: {},
      })
      .onConflictDoNothing();

    const createdProject = result[0] || { projectId, projectName, userEmail: email };

    return NextResponse.json(createdProject);
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create project in database" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const projectId = request.nextUrl.searchParams.get("projectId");
    const isArchivedParam = request.nextUrl.searchParams.get("archived");
    const isSharedParam = request.nextUrl.searchParams.get("shared");
    const isArchived = isArchivedParam === "true";
    const isShared = isSharedParam === "true";
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!projectId) {
      if (isShared) {
        // Fetch projects shared with current user
        const allProjects = await db
          .select({
            id: projects.id,
            projectId: projects.projectId,
            projectName: projects.projectName,
            userEmail: projects.userEmail,
            isArchived: projects.isArchived,
            sharedWith: projects.sharedWith,
            createdAt: projects.createdAt,
            previewImage: whiteboardData.previewImage,
            updatedAt: whiteboardData.updatedAt,
          })
          .from(projects)
          .leftJoin(whiteboardData, eq(projects.projectId, whiteboardData.projectId))
          .where(eq(projects.isArchived, false));

        const sharedList = allProjects.filter((p) => {
          if (p.userEmail === email) return false;
          const sharedArray = Array.isArray(p.sharedWith) ? p.sharedWith : [];
          return sharedArray.includes(email);
        });

        return NextResponse.json(sharedList);
      }

      // Fetch user's own projects
      const projectList = await db
        .select({
          id: projects.id,
          projectId: projects.projectId,
          projectName: projects.projectName,
          userEmail: projects.userEmail,
          isArchived: projects.isArchived,
          sharedWith: projects.sharedWith,
          createdAt: projects.createdAt,
          previewImage: whiteboardData.previewImage,
          updatedAt: whiteboardData.updatedAt,
        })
        .from(projects)
        .leftJoin(whiteboardData, eq(projects.projectId, whiteboardData.projectId))
        .where(and(eq(projects.userEmail, email), eq(projects.isArchived, isArchived)));

      return NextResponse.json(projectList);
    }

    // Fetch single project by projectId
    const targetProject = await db
      .select()
      .from(projects)
      .where(eq(projects.projectId, projectId));

    if (targetProject.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const proj = targetProject[0];
    const isOwner = proj.userEmail === email;
    const sharedArray = Array.isArray(proj.sharedWith) ? proj.sharedWith : [];
    const isSharedUser = sharedArray.includes(email);

    if (!isOwner && !isSharedUser) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 });
    }

    const result = await db
      .select()
      .from(whiteboardData)
      .where(eq(whiteboardData.projectId, projectId));

    return NextResponse.json({
      ...(result[0] || {}),
      projectName: proj.projectName,
      isArchived: proj.isArchived,
      isOwner,
      userEmail: proj.userEmail,
      sharedWith: sharedArray,
    });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch project data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json().catch(() => ({}));
    const { projectId, action, projectName: newProjectName, targetEmail } = body;
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userProject = await db
      .select()
      .from(projects)
      .where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));

    if (userProject.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const currentProj = userProject[0];

    if (action === "archive") {
      const result = await db
        .update(projects)
        .set({ isArchived: true })
        .where(eq(projects.projectId, projectId))
        .returning();
      return NextResponse.json({ success: true, project: result[0] });
    }

    if (action === "restore") {
      const result = await db
        .update(projects)
        .set({ isArchived: false })
        .where(eq(projects.projectId, projectId))
        .returning();
      return NextResponse.json({ success: true, project: result[0] });
    }

    if (action === "rename" && newProjectName) {
      const result = await db
        .update(projects)
        .set({ projectName: newProjectName.trim() })
        .where(eq(projects.projectId, projectId))
        .returning();
      return NextResponse.json({ success: true, project: result[0] });
    }

    if (action === "share" && targetEmail) {
      const cleanedTarget = targetEmail.trim().toLowerCase();
      const currentShared = Array.isArray(currentProj.sharedWith) ? (currentProj.sharedWith as string[]) : [];
      if (!currentShared.includes(cleanedTarget)) {
        currentShared.push(cleanedTarget);
      }
      const result = await db
        .update(projects)
        .set({ sharedWith: currentShared })
        .where(eq(projects.projectId, projectId))
        .returning();
      return NextResponse.json({ success: true, project: result[0] });
    }

    return NextResponse.json({ error: "Invalid action or missing payload." }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/projects error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const projectId = body?.projectId || request.nextUrl.searchParams.get("projectId");
  const permanent = body?.permanent === true || request.nextUrl.searchParams.get("permanent") === "true";
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

  if (permanent) {
    // Hard delete
    await db.delete(whiteboardData).where(eq(whiteboardData.projectId, projectId));
    await db.delete(projects).where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));
    return NextResponse.json({ success: true, mode: "permanent" });
  } else {
    // Soft delete (archive)
    await db
      .update(projects)
      .set({ isArchived: true })
      .where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));
    return NextResponse.json({ success: true, mode: "archived" });
  }
}
