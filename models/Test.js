import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
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
    questions: {
      type: mongoose.Schema.Types.Mixed, // JSON format
      required: function () {
        return this.testType === "listening" || this.testType === "reading";
      },
    },
    answerKey: {
      type: mongoose.Schema.Types.Mixed, // JSON format
      required: function () {
        return this.testType === "listening" || this.testType === "reading";
      },
    },
    writingPrompts: {
      task1: String,
      task2: String,
    },
    speakingQuestions: {
      part1: [String],
      part2: String,
      part3: [String],
    },
    audioFile: String, // for listening tests
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Test", testSchema);
