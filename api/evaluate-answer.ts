import { evaluateAnswer, ApiError } from "./_lib/gemini.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    const { question, userAnswer, modelAnswer } = req.body ?? {};
    const data = await evaluateAnswer(question, userAnswer, modelAnswer);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error evaluating answer:", error);
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : "Failed to evaluate candidate response.";
    res.status(status).json({ error: message });
  }
}
