import express from "express";
import {
  getPendingResults,
  gradeWriting,
  gradeSpeaking,
  getResultForGrading,
  getGradingStats,
} from "../controllers/teacherController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require teacher or admin role
router.use(protect, authorize("teacher", "admin"));

// Get pending results for grading
router.get("/pending", getPendingResults);

// Get grading statistics
router.get("/stats", getGradingStats);

// Get specific result for grading
router.get("/result/:resultId", getResultForGrading);

// Grade writing test
router.post("/grade/writing/:resultId", gradeWriting);

// Grade speaking test
router.post("/grade/speaking/:resultId", gradeSpeaking);

export default router;
