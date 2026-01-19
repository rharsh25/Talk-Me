import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken); // 🔥 NEW
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
