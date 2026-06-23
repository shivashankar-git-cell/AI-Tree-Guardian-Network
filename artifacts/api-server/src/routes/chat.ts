import { Router, type IRouter } from "express";
import { HfInference } from "@huggingface/inference";

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

const FALLBACK_REPLIES = [
  "I'm having trouble connecting to my knowledge base right now. Based on general arborist guidance: ensure your tree gets deep watering sessions (not frequent shallow ones) and keep the soil mulched to retain moisture in Hyderabad's heat.",
  "I can't reach the AI service at the moment. A good general tip: trees under heat stress benefit most from early-morning watering and shade cloth during peak summer afternoons.",
  "Service temporarily unavailable. General advice: check your tree's soil moisture 5 cm below the surface — if it's dry, water immediately. Hyderabad's dry heat can deceive; the surface looks dry long before roots are stressed.",
];

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

  const hfToken = process.env.HF_TOKEN;

  if (!hfToken) {
    req.log.warn("HF_TOKEN not set – returning fallback chat reply");
    res.json({
      reply: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)],
    });
    return;
  }

  const treeContext = passportData
    ? `You are treating a ${passportData.species} tree with a health score of ${passportData.healthScore}/100. ` +
      `Its current issue is: "${passportData.possibleIssue}". ` +
      `Survival risk is ${passportData.survivalRisk}. ` +
      `The recommended treatment is: "${passportData.recommendation}".`
    : "No specific tree data is available.";

  const systemPrompt =
    `You are Tree Doctor Bot, an expert arborist AI assistant. ` +
    `${treeContext} ` +
    `The tree is located in Hyderabad, India — a hot, semi-arid climate with intense summers (up to 42°C), ` +
    `moderate monsoons (June–September), and dry winters. ` +
    `Answer the user's questions concisely and practically, tailoring all advice to this climate. ` +
    `Keep replies under 120 words. Do not use markdown headers. Use plain conversational language.`;

  try {
    const hf = new HfInference(hfToken);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const completion = await hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages,
      max_tokens: 200,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) throw new Error("Empty reply from model");

    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat inference failed – returning fallback");
    res.json({
      reply: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)],
    });
  }
});

export default router;
