import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist } from "@/db";
import { liveRooms, projects } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json().catch(() => ({}));
    const { boardId } = body;
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!boardId) {
      return NextResponse.json({ error: "Missing required parameter: boardId" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Verify user access to the board
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.projectId, boardId));

    if (userProjects.length === 0) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const proj = userProjects[0];
    const isOwner = proj.userEmail === email;
    const sharedArray = Array.isArray(proj.sharedWith) ? (proj.sharedWith as string[]) : [];
    const isShared = sharedArray.includes(email);

    if (!isOwner && !isShared) {
      return NextResponse.json({ error: "Unauthorized access to board" }, { status: 403 });
    }

    // Check if active live room already exists for this board
    const existingRooms = await db
      .select()
      .from(liveRooms)
      .where(and(eq(liveRooms.boardId, boardId), eq(liveRooms.status, "active")));

    if (existingRooms.length > 0) {
      return NextResponse.json({
        room: existingRooms[0],
        projectName: proj.projectName,
        isOwner: existingRooms[0].createdBy === email,
      });
    }

    // Generate unique Room ID (e.g. ABC123456)
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room-${randomCode}`;

    const newRoomResult = await db
      .insert(liveRooms)
      .values({
        roomId,
        boardId,
        createdBy: email,
        status: "active",
      })
      .returning();

    const createdRoom = newRoomResult[0];

    return NextResponse.json({
      room: createdRoom,
      projectName: proj.projectName,
      isOwner: true,
    });
  } catch (error: any) {
    console.error("POST /api/rooms error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create live room" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const roomId = request.nextUrl.searchParams.get("roomId");
    const boardId = request.nextUrl.searchParams.get("boardId");
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (boardId) {
      const activeRooms = await db
        .select()
        .from(liveRooms)
        .where(and(eq(liveRooms.boardId, boardId), eq(liveRooms.status, "active")));

      return NextResponse.json({
        activeRoom: activeRooms[0] || null,
      });
    }

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId or boardId" }, { status: 400 });
    }

    const roomResults = await db
      .select()
      .from(liveRooms)
      .where(eq(liveRooms.roomId, roomId));

    if (roomResults.length === 0) {
      return NextResponse.json({ error: "Live room not found" }, { status: 404 });
    }

    const room = roomResults[0];

    // Fetch associated board
    const projectResults = await db
      .select()
      .from(projects)
      .where(eq(projects.projectId, room.boardId));

    if (projectResults.length === 0) {
      return NextResponse.json({ error: "Associated board not found" }, { status: 404 });
    }

    const proj = projectResults[0];
    const isOwner = proj.userEmail === email;
    const isRoomCreator = room.createdBy === email;
    const sharedArray = Array.isArray(proj.sharedWith) ? (proj.sharedWith as string[]) : [];
    const isShared = sharedArray.includes(email);

    if (!isOwner && !isShared && !isRoomCreator) {
      return NextResponse.json({ error: "Unauthorized access to live room" }, { status: 403 });
    }

    return NextResponse.json({
      room,
      boardId: room.boardId,
      projectName: proj.projectName,
      isOwner,
      isRoomCreator,
      status: room.status,
      permission: "edit",
    });
  } catch (error: any) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch room details" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json().catch(() => ({}));
    const { roomId, action } = body;
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const roomResults = await db
      .select()
      .from(liveRooms)
      .where(eq(liveRooms.roomId, roomId));

    if (roomResults.length === 0) {
      return NextResponse.json({ error: "Live room not found" }, { status: 404 });
    }

    const room = roomResults[0];

    if (action === "end") {
      if (room.createdBy !== email) {
        return NextResponse.json({ error: "Only the room owner can end the live room" }, { status: 403 });
      }

      const updated = await db
        .update(liveRooms)
        .set({ status: "ended", endedAt: new Date() })
        .where(eq(liveRooms.roomId, roomId))
        .returning();

      return NextResponse.json({ success: true, room: updated[0] });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/rooms error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update live room" }, { status: 500 });
  }
}
