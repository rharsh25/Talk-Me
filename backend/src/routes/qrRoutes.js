import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  generateQR,
  verifyQrLogin,
  getQrStatus,
} from "../controllers/qr.controller.js";

const router = express.Router();

/* =====================================================
   🌐 WEB — Generate QR (user must be logged in)
   GET /api/qr/generate
===================================================== */
router.get("/generate", authMiddleware, generateQR);

/* =====================================================
   📱 MOBILE — Verify QR & Login
   POST /api/qr/verify
   body: { token }
===================================================== */
router.post("/verify", verifyQrLogin);

/* =====================================================
   🔁 OPTIONAL — QR Status Polling
   GET /api/qr/status?token=XXXX
===================================================== */
router.get("/status", getQrStatus);

export default router;
