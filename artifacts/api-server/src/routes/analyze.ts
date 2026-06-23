import { Router, type IRouter } from "express";
import { HfInference } from "@huggingface/inference";
import { db, treesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { WaterLog } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function generateTreeId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TREE-${suffix}`;
}

const CARBON_TABLE: Array<[string, number]> = [
  ["azadirachta", 22],
  ["neem", 22],
  ["mangifera", 18],
  ["mango", 18],
  ["ficus benghalensis", 35],
  ["banyan", 35],
  ["ficus religiosa", 28],
  ["peepal", 28],
  ["eucalyptus", 30],
  ["tamarindus", 20],
  ["tamarind", 20],
  ["quercus", 25],
  ["oak", 25],
  ["tectona", 27],
  ["teak", 27],
  ["dalbergia", 24],
  ["pongamia", 21],
  ["cassia", 16],
];

function estimateCarbon(species: string): number {
  const lower = species.toLowerCase();
  for (const [key, kg] of CARBON_TABLE) {
    if (lower.includes(key)) return kg;
  }
  // fallback: health-score-unaware generic estimate
  return 15;
}

function generateWaterLogs(): WaterLog[] {
  const logs: WaterLog[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    logs.push({
      date: d.toISOString().split("T")[0],
      liters: Math.round(8 + Math.random() * 8),
    });
  }
  return logs;
}

// ─── mock fallback ───────────────────────────────────────────────────────────

const MOCK_HF = {
  species: "Azadirachta indica (Neem)",
  health_score: 62,
  possible_issue: "Heat stress and soil moisture deficit",
  recommendation:
    "Water deeply every 2–3 days in the early morning to minimise evaporation. " +
    "Apply a thick layer of organic mulch (10–15 cm) around the base to retain moisture " +
    "during Hyderabad's intense summer heat.",
  survival_risk: "Medium",
};

// ─── POST /api/analyze-tree ──────────────────────────────────────────────────

router.post("/analyze-tree", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  let hfResult = MOCK_HF;
  let isMock = true;

  const hfToken = process.env.HF_TOKEN;

  if (hfToken) {
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
              { type: "image_url", image_url: { url: imageBase64 } },
              { type: "text", text: systemPrompt },
            ],
          },
        ],
        max_tokens: 512,
      });

      const rawText = completion.choices?.[0]?.message?.content ?? "";
      req.log.info({ rawText }, "HF model raw response");

      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in model response");

      const parsed = JSON.parse(match[0]) as typeof MOCK_HF;
      hfResult = parsed;
      isMock = false;
    } catch (err) {
      req.log.error({ err }, "HF inference failed – falling back to mock");
    }
  } else {
    req.log.warn("HF_TOKEN not set – using mock response");
  }

  // ── persist to database ──
  const treeId = generateTreeId();
  const carbonAbsorbed = estimateCarbon(hfResult.species);
  const waterLogs = generateWaterLogs();

  const [saved] = await db
    .insert(treesTable)
    .values({
      treeId,
      species: hfResult.species,
      healthScore: Math.min(100, Math.max(0, hfResult.health_score)),
      possibleIssue: hfResult.possible_issue,
      recommendation: hfResult.recommendation,
      survivalRisk: hfResult.survival_risk,
      carbonAbsorbed,
      waterLogs,
      isMock,
    })
    .returning();

  req.log.info({ treeId: saved.treeId }, "Tree record saved");
  res.json(saved);
});

// ─── GET /api/trees/:treeId ──────────────────────────────────────────────────

router.get("/trees/:treeId", async (req, res) => {
  const { treeId } = req.params;

  const [record] = await db
    .select()
    .from(treesTable)
    .where(eq(treesTable.treeId, treeId))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Tree not found" });
    return;
  }

  res.json(record);
});

// ─── GET /api/trees ──────────────────────────────────────────────────────────

router.get("/trees", async (_req, res) => {
  const records = await db
    .select()
    .from(treesTable)
    .orderBy(treesTable.createdAt);
  res.json(records);
});

export default router;
