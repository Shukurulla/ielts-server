import OpenAI from "openai";
import { config } from "dotenv";

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Grade writing task using ChatGPT
export const gradeWritingTask = async (taskType, prompt, response) => {
  try {
    const systemPrompt = `Sen akademik IELTS bo'yicha professional tekshiruvchisan. 
    
    Yozish vazifasini quyidagi 4 mezon bo'yicha baholab ber (har biri 0-9 ball):
    
    1. Task Achievement (TA) - Vazifani bajarish
    2. Coherence and Cohesion (CC) - Mantiqiylik va bog'liqlik  
    3. Lexical Resource (LR) - So'z boyligi
    4. Grammatical Range and Accuracy (GRA) - Grammatika
    
    Har bir mezon uchun aniq ball va qisqa izoh ber. JSON formatda javob ber:
    {
      "taskAchievement": 6.5,
      "coherenceCohesion": 6.0,
      "lexicalResource": 6.5,
      "grammaticalRange": 6.0,
      "overallScore": 6.25,
      "comments": "Umumiy izoh..."
    }`;

    const userPrompt = `
    Task ${taskType}:
    Vazifa: ${prompt}
    
    Talaba javobi:
    ${response}
    
    Iltimos, ushbu javobni IELTS akademik yozish mezonlari bo'yicha baholab bering.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("ChatGPT grading error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Grade speaking task using ChatGPT with transcription
export const gradeSpeakingTask = async (
  partNumber,
  question,
  transcription
) => {
  try {
    const systemPrompt = `Sen akademik IELTS bo'yicha professional tekshiruvchisan.
    
    Gapirish vazifasini quyidagi 4 mezon bo'yicha baholab ber (har biri 0-9 ball):
    
    1. Fluency and Coherence (FC) - Ravonlik va mantiqiylik
    2. Lexical Resource (LR) - So'z boyligi
    3. Grammatical Range and Accuracy (GRA) - Grammatika
    4. Pronunciation (P) - Talaffuz (transkripsiya asosida)
    
    JSON formatda javob ber:
    {
      "fluencyCoherence": 6.5,
      "lexicalResource": 6.0,
      "grammaticalRange": 6.5,
      "pronunciation": 6.0,
      "overallScore": 6.25,
      "comments": "Umumiy izoh..."
    }`;

    const userPrompt = `
    Speaking Part ${partNumber}:
    Savol: ${question}
    
    Talaba javobi (transkripsiya):
    ${transcription}
    
    Iltimos, ushbu javobni IELTS gapirish mezonlari bo'yicha baholab bering.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("ChatGPT speaking grading error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
