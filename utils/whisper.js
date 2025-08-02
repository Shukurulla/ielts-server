import OpenAI from "openai";
import fs from "fs";
import { config } from "dotenv";

config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert audio to text using OpenAI Whisper
export const transcribeAudio = async (audioFilePath) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
      response_format: "text",
      language: "en",
    });

    return {
      success: true,
      transcription: transcription,
    };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
