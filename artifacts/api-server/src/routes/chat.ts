import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

interface PassportContext {
  species: string;
  healthScore: number;
  possibleIssue: string;
  recommendation: string;
  survivalRisk: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/chat", async (req, res) => {
  const {
    message,
    history = [],
    passportData,
  } = req.body as {
    message: string;
    history?: ChatMessage[];
    passportData?: PassportContext;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY not set");
    res.status(500).json({ error: "Server configuration error: GEMINI_API_KEY is missing" });
    return;
  }

  const treeContext = passportData
    ? `You are treating a ${passportData.species} with a health score of ${passportData.healthScore}/100. ` +
      `Current issue: "${passportData.possibleIssue}". ` +
      `Survival risk: ${passportData.survivalRisk}. ` +
      `Current recommendation: "${passportData.recommendation}".`
    : "No specific tree data is available for this session.";

  const systemInstruction =
    `You are Tree Doctor Bot, an expert arborist AI assistant. ${treeContext} ` +
    `The plant is located in Hyderabad, India — hot, semi-arid climate with intense summers up to 42°C, ` +
    `monsoons from June to September, and dry winters. ` +
    `Answer concisely and practically, tailoring all advice to this specific plant and climate. ` +
    `Keep replies under 120 words. Use plain conversational language. No markdown headers or bullet lists.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build Gemini-format history (assistant role = "model" in Gemini)
    const geminiHistory = history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      contents: [
        ...geminiHistory,
        { role: "user", parts: [{ text: message }] },
      ],
    });

    const reply = response.text?.trim() ?? "";
    if (!reply) throw new Error("Empty reply from Gemini");

    res.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Gemini chat inference failed");
    res.status(500).json({ error: `Chat failed: ${msg}` });
  }
});

export default router;
