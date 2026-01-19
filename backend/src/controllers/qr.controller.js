import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createQR, getQR, verifyQR } from "../utils/qrStore.js";
import { io } from "../index.js";

/* =====================================================
   Generate QR (WEB)
   - User must be logged in
   - Creates short-lived, single-use token
===================================================== */
export const generateQR = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔑 Random single-use token
    const token = uuidv4();

    // 🧠 Store in Redis (ttl handled inside qrStore)
    await createQR(token, userId.toString());

    // 📷 QR contains ONLY the token
    const qrImage = await QRCode.toDataURL(token);

    console.log("📱 QR generated for user:", userId);

    return res.json({
      token,
      qrImage,
    });
  } catch (error) {
    console.error("❌ Generate QR Error:", error);
    return res.status(500).json({ message: "QR generation failed" });
  }
};

/* =====================================================
   Verify QR (MOBILE)
   - Mobile scans QR
   - Gets access token
===================================================== */
export const verifyQrLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // 🔍 Fetch QR from Redis
    const qr = await getQR(token);

    if (!qr || !qr.userId) {
      return res.status(400).json({ message: "Invalid or expired QR" });
    }

    console.log("✅ QR verified for user:", qr.userId);

    // 👤 Load user
    const user = await User.findById(qr.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🧨 Mark QR as used (single-use)
    await verifyQR(token);

    // 🔐 Generate JWT for mobile
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 📡 Notify web client via socket
    io.to(token).emit("qr-success", {
      userId: user._id,
      username: user.username,
      message: "QR Login Successful",
    });

    // ✅ Send token to mobile
    return res.json({
      accessToken,
      user,
    });
  } catch (error) {
    console.error("❌ Verify QR Error:", error);
    return res.status(500).json({ message: "QR verification failed" });
  }
};

/* =====================================================
   QR Status (Optional polling fallback)
===================================================== */
export const getQrStatus = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ status: "INVALID" });
    }

    const qr = await getQR(token);

    if (!qr) {
      return res.json({ status: "EXPIRED" });
    }

    return res.json({
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("❌ QR Status Error:", error);
    return res.status(500).json({ message: "Status check failed" });
  }
};
