import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

  // API route to generate daily practice
  app.post("/api/generate-practice", async (req, res) => {
    try {
      const { topic, difficulty } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }

      const ai = new GoogleGenAI({ apiKey });

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
        config: {
          responseMimeType: "application/json",
        }
      });

      if (!response.text) {
         throw new Error("No text returned from Gemini API");
      }

      const data = JSON.parse(response.text);
      res.json(data);
    } catch (error) {
      console.error("Error generating practice:", error);
      res.status(500).json({ error: "Failed to generate practice session." });
    }
  });

  // API route to evaluate candidate answer
  app.post("/api/evaluate-answer", async (req, res) => {
    try {
      const { question, userAnswer, modelAnswer } = req.body;
      if (!question || !userAnswer || !modelAnswer) {
        return res.status(400).json({ error: "Missing required fields (question, userAnswer, modelAnswer)." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }

      const ai = new GoogleGenAI({ apiKey });

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
        config: {
          responseMimeType: "application/json",
        }
      });

      if (!response.text) {
         throw new Error("No text returned from Gemini API");
      }

      const data = JSON.parse(response.text);
      res.json(data);
    } catch (error) {
      console.error("Error evaluating answer:", error);
      res.status(500).json({ error: "Failed to evaluate candidate response." });
    }
  });

  // Vite middleware for development (only when running locally)
  if (process.env.VERCEL !== '1') {
    const startLocalServer = async () => {
      if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    };

    startLocalServer();
  }

export default app;
