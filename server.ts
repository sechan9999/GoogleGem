import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to generate daily practice
  app.post("/api/generate-practice", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Generate a daily interview practice session for a Data Scientist role. 
Format the response as JSON with the following structure:
{
  "topic": "String (e.g., A/B Testing, Machine Learning Basics, SQL, etc.)",
  "description": "String (Brief overview of why this topic is important)",
  "questions": [
    {
      "question": "String (The interview question)",
      "answer": "String (A comprehensive, ideal answer)",
      "tips": "String (Tips on how to approach this question in an interview)"
    }
  ]
}
Generate exactly 3 high-quality questions for the chosen topic. Focus on practical data science scenarios.
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
}

startServer();
