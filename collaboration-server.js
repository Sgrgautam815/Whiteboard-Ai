const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.COLLAB_PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end("Not Found");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// In-memory room state tracking
const rooms = new Map(); // boardId -> Map<socketId, UserPresence>
const boardScenes = new Map(); // boardId -> latest elements array

io.on("connection", (socket) => {
  let currentBoardId = null;
  let currentUser = null;

  socket.on("join-room", ({ boardId, user, permission = "edit", isOwner = false }) => {
    if (!boardId) return;

    if (currentBoardId && currentBoardId !== boardId) {
      socket.leave(`board:${currentBoardId}`);
      removeUserFromRoom(currentBoardId, socket.id);
    }

    currentBoardId = boardId;
    currentUser = {
      ...user,
      socketId: socket.id,
      permission,
      isOwner,
      status: "Editing",
      color: user?.color || generateUserColor(user?.id || socket.id),
      joinedAt: Date.now(),
    };

    const roomKey = `board:${boardId}`;
    socket.join(roomKey);

    if (!rooms.has(boardId)) {
      rooms.set(boardId, new Map());
    }
    rooms.get(boardId).set(socket.id, currentUser);

    console.log(`[Socket.IO] User ${currentUser.name || socket.id} joined ${roomKey}`);

    broadcastRoomPresence(boardId);

    if (boardScenes.has(boardId)) {
      socket.emit("initial-scene-sync", {
        boardId,
        elements: boardScenes.get(boardId),
      });
    }
  });

  socket.on("elements-change", ({ boardId, elements, isAiGenerated = false }) => {
    if (!boardId || !Array.isArray(elements)) return;

    const roomUsers = rooms.get(boardId);
    const userState = roomUsers?.get(socket.id);
    if (userState && userState.permission === "view") {
      console.warn(`[Socket.IO] View-only user ${socket.id} attempted edit on ${boardId}`);
      return;
    }

    boardScenes.set(boardId, elements);

    socket.to(`board:${boardId}`).emit("elements-change", {
      boardId,
      elements,
      senderSocketId: socket.id,
      senderName: currentUser?.name || "Collaborator",
      isAiGenerated,
      timestamp: Date.now(),
    });
  });

  socket.on("cursor-move", ({ boardId, x, y }) => {
    if (!boardId || !currentUser) return;

    socket.to(`board:${boardId}`).emit("cursor-update", {
      socketId: socket.id,
      user: currentUser,
      x,
      y,
      timestamp: Date.now(),
    });
  });

  socket.on("selection-change", ({ boardId, selectedElementIds }) => {
    if (!boardId || !currentUser) return;

    socket.to(`board:${boardId}`).emit("selection-update", {
      socketId: socket.id,
      user: currentUser,
      selectedElementIds,
    });
  });

  socket.on("end-room", ({ boardId }) => {
    if (!boardId) return;
    io.to(`board:${boardId}`).emit("room-ended", {
      boardId,
      message: "Live room session has been ended by the owner.",
    });
    rooms.delete(boardId);
    boardScenes.delete(boardId);
  });

  socket.on("leave-room", ({ boardId }) => {
    if (!boardId) return;
    socket.leave(`board:${boardId}`);
    removeUserFromRoom(boardId, socket.id);
  });

  socket.on("disconnect", () => {
    if (currentBoardId) {
      removeUserFromRoom(currentBoardId, socket.id);
    }
  });
});

function removeUserFromRoom(boardId, socketId) {
  if (rooms.has(boardId)) {
    const roomMap = rooms.get(boardId);
    roomMap.delete(socketId);
    if (roomMap.size === 0) {
      rooms.delete(boardId);
      setTimeout(() => {
        if (!rooms.has(boardId)) {
          boardScenes.delete(boardId);
        }
      }, 5 * 60 * 1000);
    } else {
      broadcastRoomPresence(boardId);
    }
  }
}

function broadcastRoomPresence(boardId) {
  if (rooms.has(boardId)) {
    const onlineUsers = Array.from(rooms.get(boardId).values());
    io.to(`board:${boardId}`).emit("presence-update", {
      boardId,
      onlineUsers,
      totalCount: onlineUsers.length,
    });
  }
}

function generateUserColor(idString) {
  const colors = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#d97706",
    "#be123c",
  ];
  let hash = 0;
  const str = String(idString || Math.random());
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

server.listen(PORT, () => {
  console.log(`[Real-Time Server] Socket.IO Collaboration Server running on port ${PORT}`);
});
