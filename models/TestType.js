import mongoose from "mongoose";

const testTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["listening", "reading", "writing", "speaking"],
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    timeLimit: {
      type: Number, // minutes
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("TestType", testTypeSchema);
