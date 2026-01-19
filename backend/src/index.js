import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import userRoutes from "./routes/user.routes.js";
import messageRoutes from "./routes/message.routes.js";
import backupRoutes from "./routes/backupRoutes.js";

import Message from "./models/message.js";

dotenv.config();
connectDB();

/* ==============================
   Express App
============================== */
const app = express();

/* ==============================
   Middlewares
============================== */
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Web
      "http://localhost:8081", // Expo Web
      "http://127.0.0.1:8081",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* ==============================
   Routes
============================== */
app.use("/api/auth", authRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/backup", backupRoutes);

/* ==============================
   HTTP Server
============================== */
const server = http.createServer(app);

/* ==============================
   Socket.IO Server
============================== */
export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
    ],
    credentials: true,
  },
});

/* ==============================
   Socket Events
============================== */
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* ============================
     Join User Room
     Each user has a private room = userId
  ============================ */
  socket.on("join-user", (userId) => {
    if (!userId) {
      console.warn("⚠️ join-user called without userId");
      return;
    }

    const roomId = userId.toString();
    socket.join(roomId);

    console.log(`👤 User joined room: ${roomId}`);
  });

  /* ============================
     Send Message
  ============================ */
  socket.on("send-message", async (payload) => {
    try {
      const {
        encryptedText,
        senderId,
        senderName,
        receiverId,
      } = payload;

      if (!senderId || !receiverId || !encryptedText) {
        console.warn("⚠️ Invalid message payload:", payload);
        return;
      }

      console.log("📩 Message received from:", senderId);

      // ✅ Save message in DB
      const message = await Message.create({
        encryptedText,
        senderId,
        senderName,
        receiverId,
      });

      // ✅ Emit to BOTH users (NO optimistic UI on client)
      const receiverRoom = receiverId.toString();
      const senderRoom = senderId.toString();

      io.to(receiverRoom).emit("new-message", message);
      io.to(senderRoom).emit("new-message", message);

      console.log("✅ Message delivered:", message._id);
    } catch (error) {
      console.error("❌ Socket Message Error:", error.message);
    }
  });

  /* ============================
     Disconnect
  ============================ */
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* ==============================
   Start Server
============================== */
const PORT = process.env.PORT || 4000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
