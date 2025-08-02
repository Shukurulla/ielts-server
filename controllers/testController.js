import Test from "../models/Test.js";
import TestResult from "../models/TestResult.js";
import {
  errorResponse,
  successResponse,
  checkAnswers,
  calculateBandScore,
} from "../utils/helpers.js";
import { gradeWritingTask, gradeSpeakingTask } from "../utils/chatgpt.js";
import { transcribeAudio } from "../utils/whisper.js";
import path from "path";

// Get all tests
export const getAllTests = async (req, res) => {
  try {
    const { testType, isFullTest } = req.query;

    const filter = { isActive: true };
    if (testType) filter.testType = testType;
    if (isFullTest !== undefined) filter.isFullTest = isFullTest === "true";

    const tests = await Test.find(filter)
      .select("title testType isFullTest createdAt")
      .sort({ createdAt: -1 });

    successResponse(res, { tests }, "Tests retrieved successfully");
  } catch (error) {
    console.error("Get tests error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Get test by ID
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return errorResponse(res, 404, "Test not found");
    }

    successResponse(res, { test }, "Test retrieved successfully");
  } catch (error) {
    console.error("Get test error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Submit listening/reading test
export const submitListeningReading = async (req, res) => {
  try {
    const { testId, answers } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return errorResponse(res, 404, "Test not found");
    }

    if (test.testType !== "listening" && test.testType !== "reading") {
      return errorResponse(res, 400, "Invalid test type for this submission");
    }

    // Check answers
    const checkResult = checkAnswers(answers, test.answerKey);
    const bandScore = calculateBandScore(
      checkResult.correctCount,
      checkResult.totalQuestions,
      test.testType
    );

    // Save result
    const testResult = await TestResult.create({
      user: req.user.id,
      test: testId,
      testType: test.testType,
      isFullTest: test.isFullTest,
      [test.testType === "listening" ? "listeningScore" : "readingScore"]:
        bandScore,
      answers: answers,
      gradingStatus: "completed",
    });

    testResult.calculateOverallScore();
    await testResult.save();

    successResponse(
      res,
      {
        result: testResult,
        checkResult: checkResult,
        bandScore: bandScore,
      },
      "Test submitted successfully"
    );
  } catch (error) {
    console.error("Submit test error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Submit writing test
export const submitWriting = async (req, res) => {
  try {
    const { testId, task1Response, task2Response, useAI = true } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return errorResponse(res, 404, "Test not found");
    }

    if (test.testType !== "writing") {
      return errorResponse(res, 400, "Invalid test type for this submission");
    }

    // Create initial result
    const testResult = await TestResult.create({
      user: req.user.id,
      test: testId,
      testType: "writing",
      isFullTest: test.isFullTest,
      writingResponses: {
        task1: task1Response,
        task2: task2Response,
      },
      gradingStatus: useAI ? "pending" : "pending",
    });

    if (useAI) {
      // Grade with AI
      try {
        const task1Grade = await gradeWritingTask(
          1,
          test.writingPrompts.task1,
          task1Response
        );
        const task2Grade = await gradeWritingTask(
          2,
          test.writingPrompts.task2,
          task2Response
        );

        if (task1Grade.success && task2Grade.success) {
          testResult.feedback.writing = {
            task1: {
              ...task1Grade.data,
              aiGenerated: true,
            },
            task2: {
              ...task2Grade.data,
              aiGenerated: true,
            },
          };

          // Calculate writing score
          const avgScore =
            (task1Grade.data.overallScore + task2Grade.data.overallScore) / 2;
          testResult.writingScore = Math.round(avgScore * 2) / 2;
          testResult.gradingStatus = "ai_graded";
        }
      } catch (aiError) {
        console.error("AI grading error:", aiError);
        testResult.gradingStatus = "pending";
      }
    }

    testResult.calculateOverallScore();
    await testResult.save();

    successResponse(
      res,
      { result: testResult },
      "Writing test submitted successfully"
    );
  } catch (error) {
    console.error("Submit writing error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Submit speaking test
export const submitSpeaking = async (req, res) => {
  try {
    const { testId, useAI = true } = req.body;
    const { part1Audio, part2Audio, part3Audio } = req.files || {};

    const test = await Test.findById(testId);
    if (!test) {
      return errorResponse(res, 404, "Test not found");
    }

    if (test.testType !== "speaking") {
      return errorResponse(res, 400, "Invalid test type for this submission");
    }

    // Save audio files
    const audioFiles = {};
    if (part1Audio) audioFiles.part1 = part1Audio[0].filename;
    if (part2Audio) audioFiles.part2 = part2Audio[0].filename;
    if (part3Audio) audioFiles.part3 = part3Audio[0].filename;

    // Create initial result
    const testResult = await TestResult.create({
      user: req.user.id,
      test: testId,
      testType: "speaking",
      isFullTest: test.isFullTest,
      speakingAudios: audioFiles,
      gradingStatus: useAI ? "pending" : "pending",
    });

    if (useAI) {
      try {
        // Transcribe and grade each part
        const gradingPromises = [];

        if (part1Audio) {
          const audioPath = path.join(
            process.cwd(),
            "uploads",
            part1Audio[0].filename
          );
          gradingPromises.push(
            transcribeAudio(audioPath).then(async (transcription) => {
              if (transcription.success) {
                const grade = await gradeSpeakingTask(
                  1,
                  "Part 1 Questions",
                  transcription.transcription
                );
                return {
                  part: 1,
                  transcription: transcription.transcription,
                  grade: grade.data,
                };
              }
              return null;
            })
          );
        }

        const gradingResults = await Promise.all(gradingPromises);

        // Process results and calculate score
        let totalScore = 0;
        let partCount = 0;

        gradingResults.forEach((result) => {
          if (result && result.grade) {
            testResult.feedback.speaking = {
              ...result.grade,
              transcription: result.transcription,
              aiGenerated: true,
            };
            totalScore += result.grade.overallScore;
            partCount++;
          }
        });

        if (partCount > 0) {
          testResult.speakingScore =
            Math.round((totalScore / partCount) * 2) / 2;
          testResult.gradingStatus = "ai_graded";
        }
      } catch (aiError) {
        console.error("AI grading error:", aiError);
        testResult.gradingStatus = "pending";
      }
    }

    testResult.calculateOverallScore();
    await testResult.save();

    successResponse(
      res,
      { result: testResult },
      "Speaking test submitted successfully"
    );
  } catch (error) {
    console.error("Submit speaking error:", error);
    errorResponse(res, 500, "Server error");
  }
};

// Create new test (admin/teacher only)
export const createTest = async (req, res) => {
  try {
    const testData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const test = await Test.create(testData);
    successResponse(res, { test }, "Test created successfully");
  } catch (error) {
    console.error("Create test error:", error);
    errorResponse(res, 500, "Server error");
  }
};
