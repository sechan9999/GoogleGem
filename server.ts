// Local development server. On Vercel, requests are served by the static
// build (dist) and the serverless functions in /api — this file is not used.
import express from "express";
import { generatePractice, evaluateAnswer, ApiError } from "./api/_lib/gemini.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/generate-practice", async (req, res) => {
  try {
    const { topic, difficulty } = req.body ?? {};
    res.json(await generatePractice(topic, difficulty));
  } catch (error) {
    console.error("Error generating practice:", error);
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : "Failed to generate practice session.";
    res.status(status).json({ error: message });
  }
});

app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const { question, userAnswer, modelAnswer } = req.body ?? {};
    res.json(await evaluateAnswer(question, userAnswer, modelAnswer));
  } catch (error) {
    console.error("Error evaluating answer:", error);
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : "Failed to evaluate candidate response.";
    res.status(status).json({ error: message });
  }
});

const { createServer: createViteServer } = await import("vite");
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});
app.use(vite.middlewares);

app.listen(PORT, () => {
  console.log(`Dev server running on http://localhost:${PORT}`);
});
