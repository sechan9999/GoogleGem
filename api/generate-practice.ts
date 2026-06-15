import { generatePractice, ApiError } from "./_lib/gemini.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    const { topic, difficulty } = req.body ?? {};
    const data = await generatePractice(topic, difficulty);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating practice:", error);
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : "Failed to generate practice session.";
    res.status(status).json({ error: message });
  }
}
