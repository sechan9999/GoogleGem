export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Loaded lazily so the heavy ESM package is resolved at runtime instead of
// being statically bundled into the serverless function (which crashed on load).
async function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, "GEMINI_API_KEY environment variable is missing.");
  }
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
}

export async function generatePractice(topic?: string, difficulty?: string) {
  const ai = await getClient();
  const finalTopic = topic || "Machine Learning Basics";
  const finalDifficulty = difficulty || "Intermediate";

  const prompt = `
Generate a practice session for a Data Scientist role.
Topic: "${finalTopic}"
Difficulty Level: "${finalDifficulty}"

For the chosen topic and difficulty:
- Beginner: Focus on fundamental concepts, definitions, basic calculations, simple coding/SQL, and core intuition.
- Intermediate: Focus on model selection, evaluation metrics, statistical significance, intermediate coding/SQL, tuning parameters, and feature engineering.
- Advanced: Focus on complex algorithms, edge cases, machine learning system design, deep learning architectures, production deployment scaling, mathematical derivations, and multi-variable trade-offs.

Format the response as JSON with the following structure:
{
  "topic": "${finalTopic}",
  "difficulty": "${finalDifficulty}",
  "description": "String (Brief overview of why this topic is important and how it relates to the ${finalDifficulty} level)",
  "questions": [
    {
      "question": "String (The interview question)",
      "answer": "String (A comprehensive, ideal model answer)",
      "explanation": "String (Detailed breakdown of the concepts, step-by-step math or reasoning, and context behind the answer)",
      "tips": "String (Tips on how to approach this question, what key words to say, and how to structure the response during a live interview)"
    }
  ]
}
Generate exactly 5 high-quality questions for the chosen topic. Make the questions challenging and highly representative of actual data science interviews.
Return ONLY valid JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  if (!response.text) {
    throw new ApiError(502, "No text returned from Gemini API");
  }
  return JSON.parse(response.text);
}

export async function evaluateAnswer(
  question?: string,
  userAnswer?: string,
  modelAnswer?: string
) {
  if (!question || !userAnswer || !modelAnswer) {
    throw new ApiError(400, "Missing required fields (question, userAnswer, modelAnswer).");
  }

  const ai = await getClient();

  const prompt = `
You are an expert Data Science Interviewer evaluating a candidate's response.
Compare the candidate's answer to the model answer for the given question.

Question: "${question}"
Model Answer: "${modelAnswer}"
Candidate's Answer: "${userAnswer}"

Objective: Evaluate the candidate's answer for accuracy, technical depth, clarity, and completeness.
Be constructive, encouraging, and detailed.

Format the response as JSON with the following structure:
{
  "score": <number between 1 and 10 representing how close/adequate the candidate's answer is to the model answer>,
  "feedback": "String (Detailed feedback praising strong points and explaining what technical details were missing or incorrect)",
  "suggestions": "String (Specific, actionable recommendations to improve their answer to score a 10/10)"
}
Return ONLY valid JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  if (!response.text) {
    throw new ApiError(502, "No text returned from Gemini API");
  }
  return JSON.parse(response.text);
}
