// server.ts
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";
import socketService from "./app/modules/chat/socket.service";
import { ChatRoute } from "./app/modules/chat/chat.route";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = "mongodb+srv://fahadpervej:admin@cluster0.9o8rsbr.mongodb.net/fahadpervej?retryWrites=true&w=majority&appName=Cluster0";

const httpServer = http.createServer(app);

// ✅ Connect MongoDB
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ✅ Add chat route (since it’s not in app.ts)
    app.use("/api/v1/chat", ChatRoute);

    // ✅ Initialize Socket.IO
    socketService.initialize(httpServer);
    console.log("💬 Socket.IO service initialized");

    // ✅ Start HTTP + Socket server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api/v1`);
      console.log(`📡 Socket.IO ready for connections`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// ✅ Graceful shutdown for unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection, shutting down...", err);
  httpServer.close(() => process.exit(1));
});

startServer();

