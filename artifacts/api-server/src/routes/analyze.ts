import { Router, type IRouter } from "express";
import { HfInference } from "@huggingface/inference";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MOCK_RESPONSE = {
  species: "Azadirachta indica (Neem)",
  health_score: 62,
  possible_issue: "Heat stress and soil moisture deficit",
  recommendation:
    "Water deeply every 2–3 days in the early morning to minimise evaporation. Apply a thick layer of organic mulch (10–15 cm) around the base to retain soil moisture. Avoid watering during peak afternoon heat typical of Hyderabad summers.",
  survival_risk: "Medium",
};

function generateTreeId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `TRE-${year}-${num}`;
}

router.post("/analyze-tree", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const treeId = generateTreeId();

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    req.log.warn("HF_TOKEN not set – returning mock response");
    res.json({ treeId, ...MOCK_RESPONSE, isMock: true });
    return;
  }

  try {
    const hf = new HfInference(hfToken);

    const systemPrompt =
      "You are an expert arborist AI. Analyze the provided image of a tree. " +
      "You must return only a valid JSON object with no markdown formatting. " +
      "The JSON must contain these exact keys: " +
      "species (string), " +
      "health_score (number 0-100), " +
      "possible_issue (string), " +
      "recommendation (string - tailor this advice to the hot, semi-arid climate of Hyderabad), " +
      "and survival_risk (string: High, Medium, or Low).";

    const completion = await hf.chatCompletion({
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: systemPrompt,
            },
          ],
        },
      ],
      max_tokens: 512,
    });

    const rawText = completion.choices?.[0]?.message?.content ?? "";
    req.log.info({ rawText }, "HF model raw response");

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in model response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      species: string;
      health_score: number;
      possible_issue: string;
      recommendation: string;
      survival_risk: string;
    };

    res.json({ treeId, ...parsed, isMock: false });
  } catch (err) {
    req.log.error({ err }, "HF inference failed – returning mock response");
    res.json({ treeId, ...MOCK_RESPONSE, isMock: true });
  }
});

export default router;
