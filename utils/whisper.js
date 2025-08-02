import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey:
    "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",
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
