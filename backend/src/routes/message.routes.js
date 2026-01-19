import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMessages } from "../controllers/message.controller.js";

const router = express.Router();

/**
 * Fetch chat history between logged-in user & another user
 * GET /api/messages?userId=RECEIVER_ID
 */
router.get("/", authMiddleware, getMessages);

export default router;
