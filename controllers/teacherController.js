import TestResult from "../models/TestResult.js";
import { errorResponse, successResponse } from "../utils/helpers.js";

// Get pending test results for grading
export const getPendingResults = async (req, res) => {
  try {
    const { page = 1, limit = 10, testType } = req.query;

    const filter = {
      gradingStatus: { $in: ["pending", "ai_graded"] },
      $or: [{ testType: "writing" }, { testType: "speaking" }],
    };

    if (testType) filter.testType = testType;

    const results = await TestResult.find(filter)
      .populate("user", "firstName lastName email")
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
      "Pending results retrieved successfully"
    );
  } catch (error) {
    console.error("Get pending results error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Grade writing test manually
export const gradeWriting = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { task1Scores, task2Scores, task1Comments, task2Comments } = req.body;

    const result = await TestResult.findById(resultId);
    if (!result) {
      return errorResponse(res, 404, "Test result not found");
    }

    if (result.testType !== "writing") {
      return errorResponse(res, 400, "This is not a writing test");
    }

    // Update writing feedback
    result.feedback.writing = {
      task1: {
        taskAchievement: task1Scores.taskAchievement,
        coherenceCohesion: task1Scores.coherenceCohesion,
        lexicalResource: task1Scores.lexicalResource,
        grammaticalRange: task1Scores.grammaticalRange,
        comments: task1Comments,
        aiGenerated: false,
      },
      task2: {
        taskAchievement: task2Scores.taskAchievement,
        coherenceCohesion: task2Scores.coherenceCohesion,
        lexicalResource: task2Scores.lexicalResource,
        grammaticalRange: task2Scores.grammaticalRange,
        comments: task2Comments,
        aiGenerated: false,
      },
    };

    // Calculate writing score
    const task1Average =
      (task1Scores.taskAchievement +
        task1Scores.coherenceCohesion +
        task1Scores.lexicalResource +
        task1Scores.grammaticalRange) /
      4;

    const task2Average =
      (task2Scores.taskAchievement +
        task2Scores.coherenceCohesion +
        task2Scores.lexicalResource +
        task2Scores.grammaticalRange) /
      4;

    // Task 2 has more weight (2/3) than Task 1 (1/3)
    result.writingScore =
      Math.round(((task1Average + task2Average * 2) / 3) * 2) / 2;
    result.gradingStatus = "teacher_graded";
    result.gradedBy = req.user.id;

    result.calculateOverallScore();
    await result.save();

    successResponse(res, { result }, "Writing test graded successfully");
  } catch (error) {
    console.error("Grade writing error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Grade speaking test manually
export const gradeSpeaking = async (req, res) => {
  try {
    const { resultId } = req.params;
    const {
      fluencyCoherence,
      lexicalResource,
      grammaticalRange,
      pronunciation,
      comments,
    } = req.body;

    const result = await TestResult.findById(resultId);
    if (!result) {
      return errorResponse(res, 404, "Test result not found");
    }

    if (result.testType !== "speaking") {
      return errorResponse(res, 400, "This is not a speaking test");
    }

    // Update speaking feedback
    result.feedback.speaking = {
      fluencyCoherence,
      lexicalResource,
      grammaticalRange,
      pronunciation,
      comments,
      transcription: result.feedback.speaking?.transcription || "",
      aiGenerated: false,
    };

    // Calculate speaking score
    result.speakingScore =
      Math.round(
        ((fluencyCoherence +
          lexicalResource +
          grammaticalRange +
          pronunciation) /
          4) *
          2
      ) / 2;

    result.gradingStatus = "teacher_graded";
    result.gradedBy = req.user.id;

    result.calculateOverallScore();
    await result.save();

    successResponse(res, { result }, "Speaking test graded successfully");
  } catch (error) {
    console.error("Grade speaking error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get detailed result for grading
export const getResultForGrading = async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.resultId)
      .populate("user", "firstName lastName email")
      .populate("test")
      .populate("gradedBy", "firstName lastName");

    if (!result) {
      return errorResponse(res, 404, "Test result not found");
    }

    successResponse(res, { result }, "Result retrieved for grading");
  } catch (error) {
    console.error("Get result for grading error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get teacher's grading statistics
export const getGradingStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const stats = await TestResult.aggregate([
      {
        $facet: {
          totalGraded: [
            { $match: { gradedBy: teacherId } },
            { $count: "count" },
          ],
          pendingCount: [
            {
              $match: {
                gradingStatus: { $in: ["pending", "ai_graded"] },
                $or: [{ testType: "writing" }, { testType: "speaking" }],
              },
            },
            { $count: "count" },
          ],
          recentGraded: [
            { $match: { gradedBy: teacherId } },
            { $sort: { updatedAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                testType: 1,
                overallScore: 1,
                updatedAt: 1,
                "user.firstName": 1,
                "user.lastName": 1,
              },
            },
          ],
        },
      },
    ]);

    const result = {
      totalGraded: stats[0].totalGraded[0]?.count || 0,
      pendingCount: stats[0].pendingCount[0]?.count || 0,
      recentGraded: stats[0].recentGraded,
    };

    successResponse(res, result, "Grading statistics retrieved successfully");
  } catch (error) {
    console.error("Get grading stats error:", error);
    errorResponse(res, 500, "Server error");
  }
};
