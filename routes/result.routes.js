import express from "express";
import {
  getUserResults,
  getResultById,
  getScoreSummary,
  getTestPreview,
} from "../controllers/resultController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get user's all test results
router.get("/", protect, getUserResults);

// Get score summary
router.get("/summary", protect, getScoreSummary);

// Get specific result
router.get("/:id", protect, getResultById);

// Get test preview
router.get("/:id/preview", protect, getTestPreview);

export default router;
