import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    testType: {
      type: String,
      required: true,
      enum: ["listening", "reading", "writing", "speaking"],
    },
    isFullTest: {
      type: Boolean,
      default: false,
    },

    // Section scores (0-9 band scale)
    listeningScore: {
      type: Number,
      min: 0,
      max: 9,
    },
    readingScore: {
      type: Number,
      min: 0,
      max: 9,
    },
    writingScore: {
      type: Number,
      min: 0,
      max: 9,
    },
    speakingScore: {
      type: Number,
      min: 0,
      max: 9,
    },

    // Overall score calculation
    overallScore: {
      type: Number,
      min: 0,
      max: 9,
    },

    // Detailed answers for listening/reading
    answers: {
      type: mongoose.Schema.Types.Mixed, // JSON format
    },

    // Writing responses
    writingResponses: {
      task1: String,
      task2: String,
    },

    // Speaking audio files
    speakingAudios: {
      part1: String,
      part2: String,
      part3: String,
    },

    // AI/Teacher feedback
    feedback: {
      writing: {
        task1: {
          taskAchievement: Number,
          coherenceCohesion: Number,
          lexicalResource: Number,
          grammaticalRange: Number,
          comments: String,
          aiGenerated: Boolean,
        },
        task2: {
          taskAchievement: Number,
          coherenceCohesion: Number,
          lexicalResource: Number,
          grammaticalRange: Number,
          comments: String,
          aiGenerated: Boolean,
        },
      },
      speaking: {
        fluencyCoherence: Number,
        lexicalResource: Number,
        grammaticalRange: Number,
        pronunciation: Number,
        comments: String,
        transcription: String, // from Whisper
        aiGenerated: Boolean,
      },
    },

    // Grading status
    gradingStatus: {
      type: String,
      enum: ["pending", "ai_graded", "teacher_graded", "completed"],
      default: "pending",
    },

    // Teacher who graded (if manually graded)
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Calculate overall score method
testResultSchema.methods.calculateOverallScore = function () {
  const scores = [];

  if (this.listeningScore !== undefined) scores.push(this.listeningScore);
  if (this.readingScore !== undefined) scores.push(this.readingScore);
  if (this.writingScore !== undefined) scores.push(this.writingScore);
  if (this.speakingScore !== undefined) scores.push(this.speakingScore);

  if (scores.length > 0) {
    this.overallScore =
      Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
  }

  return this.overallScore;
};

export default mongoose.model("TestResult", testResultSchema);
