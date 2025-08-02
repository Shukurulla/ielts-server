import express from "express";
import {
  getAllTests,
  getTestById,
  submitListeningReading,
  submitWriting,
  submitSpeaking,
  createTest,
} from "../controllers/testController.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadAudio } from "../middleware/upload.js";

const router = express.Router();

// Get all tests
router.get("/", protect, getAllTests);

// Get specific test
router.get("/:id", protect, getTestById);

// Submit listening/reading test
router.post("/submit/listening-reading", protect, submitListeningReading);

// Submit writing test
router.post("/submit/writing", protect, submitWriting);

// Submit speaking test (with audio files)
router.post(
  "/submit/speaking",
  protect,
  uploadAudio.fields([
    { name: "part1Audio", maxCount: 1 },
    { name: "part2Audio", maxCount: 1 },
    { name: "part3Audio", maxCount: 1 },
  ]),
  submitSpeaking
);

// Create new test (admin/teacher only)
router.post("/", protect, authorize("admin", "teacher"), createTest);

export default router;
