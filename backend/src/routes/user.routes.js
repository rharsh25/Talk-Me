import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUsersWithLastMessage } from "../controllers/user.controller.js";

const router = express.Router();

/**
 * GET /api/users
 * Returns users with last message preview
 */
router.get("/", authMiddleware, getUsersWithLastMessage);

export default router;
