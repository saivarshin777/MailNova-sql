import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // Join room based on user ID for targeted tenant notifications
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(String(userId));
        console.log(`[Socket] User ${userId} joined room`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const sendRealTimeNotification = (userId, notification) => {
  if (!io) {
    console.warn("[Socket] Socket server not initialized");
    return;
  }
  
  if (userId) {
    console.log(`[Socket] Emitting notification to user room ${userId}: ${notification.title}`);
    io.to(String(userId)).emit("notification", notification);
  } else {
    console.log(`[Socket] Broadcasting notification: ${notification.title}`);
    io.emit("notification", notification);
  }
};
