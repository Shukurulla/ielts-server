import jwt from "jsonwebtoken";

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Calculate IELTS band score from correct answers
export const calculateBandScore = (
  correctAnswers,
  totalQuestions,
  testType
) => {
  const percentage = (correctAnswers / totalQuestions) * 100;

  // IELTS band score conversion table (approximate)
  if (percentage >= 90) return 9.0;
  if (percentage >= 85) return 8.5;
  if (percentage >= 80) return 8.0;
  if (percentage >= 75) return 7.5;
  if (percentage >= 70) return 7.0;
  if (percentage >= 65) return 6.5;
  if (percentage >= 60) return 6.0;
  if (percentage >= 55) return 5.5;
  if (percentage >= 50) return 5.0;
  if (percentage >= 45) return 4.5;
  if (percentage >= 40) return 4.0;
  if (percentage >= 35) return 3.5;
  if (percentage >= 30) return 3.0;
  if (percentage >= 25) return 2.5;
  if (percentage >= 20) return 2.0;
  if (percentage >= 15) return 1.5;
  if (percentage >= 10) return 1.0;
  return 0.5;
};

// Check answers for listening/reading tests
export const checkAnswers = (userAnswers, answerKey) => {
  let correctCount = 0;
  const results = [];

  userAnswers.forEach((answer, index) => {
    const isCorrect = answer === answerKey[index];
    if (isCorrect) correctCount++;

    results.push({
      questionIndex: index,
      userAnswer: answer,
      correctAnswer: answerKey[index],
      isCorrect,
    });
  });

  return {
    correctCount,
    totalQuestions: userAnswers.length,
    results,
  };
};

// Format error response
export const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// Format success response
export const successResponse = (res, data, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};
