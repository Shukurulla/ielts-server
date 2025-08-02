import TestResult from "../models/TestResult.js";
import { errorResponse, successResponse } from "../utils/helpers.js";

// Get user's test results
export const getUserResults = async (req, res) => {
  try {
    const { page = 1, limit = 10, testType, isFullTest } = req.query;

    const filter = { user: req.user.id };
    if (testType) filter.testType = testType;
    if (isFullTest !== undefined) filter.isFullTest = isFullTest === "true";

    const results = await TestResult.find(filter)
      .populate("test", "title testType")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TestResult.countDocuments(filter);

    successResponse(
      res,
      {
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Results retrieved successfully"
    );
  } catch (error) {
    console.error("Get user results error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get specific test result
export const getResultById = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate("test")
      .populate("user", "firstName lastName email")
      .populate("gradedBy", "firstName lastName");

    if (!result) {
      return errorResponse(res, 404, "Result not found");
    }

    // Check if user owns this result or is teacher/admin
    if (
      result.user._id.toString() !== req.user.id &&
      !["teacher", "admin"].includes(req.user.role)
    ) {
      return errorResponse(res, 403, "Access denied");
    }

    successResponse(res, { result }, "Result retrieved successfully");
  } catch (error) {
    console.error("Get result error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get user's score summary
export const getScoreSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get latest scores for each test type
    const latestScores = await TestResult.aggregate([
      {
        $match: {
          user: userId,
          gradingStatus: { $in: ["ai_graded", "teacher_graded", "completed"] },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$testType",
          latestScore: { $first: "$$ROOT" },
        },
      },
    ]);

    // Get full test results
    const fullTestResults = await TestResult.find({
      user: userId,
      isFullTest: true,
      gradingStatus: { $in: ["ai_graded", "teacher_graded", "completed"] },
    })
      .populate("test", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate overall stats
    const totalTests = await TestResult.countDocuments({ user: userId });
    const completedTests = await TestResult.countDocuments({
      user: userId,
      gradingStatus: { $in: ["ai_graded", "teacher_graded", "completed"] },
    });

    successResponse(
      res,
      {
        latestScores: latestScores.map((item) => item.latestScore),
        fullTestResults,
        stats: {
          totalTests,
          completedTests,
          pendingTests: totalTests - completedTests,
        },
      },
      "Score summary retrieved successfully"
    );
  } catch (error) {
    console.error("Get score summary error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get test preview (first question and answer)
export const getTestPreview = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id).populate("test");

    if (!result) {
      return errorResponse(res, 404, "Result not found");
    }

    // Check access
    if (
      result.user.toString() !== req.user.id &&
      !["teacher", "admin"].includes(req.user.role)
    ) {
      return errorResponse(res, 403, "Access denied");
    }

    let preview = {};

    if (result.testType === "listening" || result.testType === "reading") {
      // Get first question and user's answer
      const firstQuestion = result.test.questions[0];
      const userAnswer = result.answers[0];
      const correctAnswer = result.test.answerKey[0];

      preview = {
        question: firstQuestion,
        userAnswer,
        correctAnswer,
        isCorrect: userAnswer === correctAnswer,
      };
    } else if (result.testType === "writing") {
      preview = {
        task1Prompt: result.test.writingPrompts.task1,
        task1Response: result.writingResponses.task1?.substring(0, 200) + "...",
        task2Prompt: result.test.writingPrompts.task2,
        task2Response: result.writingResponses.task2?.substring(0, 200) + "...",
      };
    } else if (result.testType === "speaking") {
      preview = {
        audioFiles: result.speakingAudios,
        transcriptionPreview:
          result.feedback.speaking?.transcription?.substring(0, 200) + "...",
      };
    }

    successResponse(res, { preview }, "Preview retrieved successfully");
  } catch (error) {
    console.error("Get preview error:", error);
    errorResponse(res, 500, "Server error");
  }
};
