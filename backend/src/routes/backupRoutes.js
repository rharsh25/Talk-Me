import express from "express";
import {
  exportBackup,
  importBackup,
} from "../controllers/backupController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/export", authMiddleware, exportBackup);
router.post("/import", authMiddleware, importBackup);

export default router;
