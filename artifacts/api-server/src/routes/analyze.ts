import { Router, type IRouter } from "express";
import { HfInference } from "@huggingface/inference";
import sharp from "sharp";
import { db, treesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { WaterLog } from "@workspace/db";

const router: IRouter = Router();

// ─── Tree ID generator ───────────────────────────────────────────────────────

function generateTreeId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TREE-${suffix}`;
}

// ─── Image compression ───────────────────────────────────────────────────────

async function compressImage(dataUrl: string): Promise<string> {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) throw new Error("Invalid image data URL");

  const base64Data = dataUrl.slice(commaIdx + 1);
  const inputBuffer = Buffer.from(base64Data, "base64");

  const outputBuffer = await sharp(inputBuffer)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return `data:image/jpeg;base64,${outputBuffer.toString("base64")}`;
}

// ─── Parse helpers ───────────────────────────────────────────────────────────

function parseCarbonNumber(carbonStr: string): number {
  const match = String(carbonStr).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function generateWaterLogs(litersPerDay: number): WaterLog[] {
  const logs: WaterLog[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const jitter = (Math.random() - 0.5) * 0.15 * litersPerDay;
    logs.push({
      date: d.toISOString().split("T")[0],
      liters: Math.round((litersPerDay + jitter) * 10) / 10,
    });
  }
  return logs;
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  "You are a master botanist and arborist AI. Analyze the provided image of the plant/tree. " +
  "You must return only a valid JSON object with no markdown formatting. " +
  "The JSON must contain these exact keys: " +
  "species (string: exact scientific and common name), " +
  "health_score (number 0-100), " +
  "possible_issue (string: analyze the leaves, soil, and environment), " +
  "recommendation (string: highly specific care tailored to the hot, semi-arid climate of Hyderabad, India), " +
  "survival_risk (string: High, Medium, Low), " +
  "carbon_absorbed (string: realistic estimate in kg/year based on the plant's size), and " +
  "water_requirement_liters_per_day (number: explicitly calculate this based on whether it is a small potted plant, which needs very little, or a large ground tree).";

// ─── POST /api/analyze-tree ──────────────────────────────────────────────────

router.post("/analyze-tree", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    req.log.error("HF_TOKEN environment variable is not set");
    res.status(500).json({ error: "Server configuration error: HF_TOKEN is missing" });
    return;
  }

  // Compress before sending to avoid HF payload rejections
  let compressedImage: string;
  try {
    compressedImage = await compressImage(imageBase64);
    req.log.info("Image compressed successfully");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Image compression failed");
    res.status(500).json({ error: `Image processing failed: ${msg}` });
    return;
  }

  // Call HF vision model
  let hfResult: {
    species: string;
    health_score: number;
    possible_issue: string;
    recommendation: string;
    survival_risk: string;
    carbon_absorbed: string;
    water_requirement_liters_per_day: number;
  };

  try {
    const hf = new HfInference(hfToken);

    const completion = await hf.chatCompletion({
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: compressedImage } },
            { type: "text", text: SYSTEM_PROMPT },
          ],
        },
      ],
      max_tokens: 600,
    });

    const rawText = completion.choices?.[0]?.message?.content ?? "";
    req.log.info({ rawText }, "HF model raw response");

    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return a JSON object");

    hfResult = JSON.parse(match[0]);

    // Validate required keys are present
    const required = ["species", "health_score", "possible_issue", "recommendation", "survival_risk", "carbon_absorbed", "water_requirement_liters_per_day"];
    for (const key of required) {
      if (!(key in hfResult)) throw new Error(`Missing key in AI response: "${key}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "HF inference failed");
    res.status(500).json({ error: `AI Analysis Failed: ${msg}` });
    return;
  }

  // Persist to database
  try {
    const treeId = generateTreeId();
    const carbonAbsorbed = parseCarbonNumber(hfResult.carbon_absorbed);
    const dailyLiters = Number(hfResult.water_requirement_liters_per_day) || 10;
    const waterLogs = generateWaterLogs(dailyLiters);

    const [saved] = await db
      .insert(treesTable)
      .values({
        treeId,
        species: hfResult.species,
        healthScore: Math.min(100, Math.max(0, Math.round(hfResult.health_score))),
        possibleIssue: hfResult.possible_issue,
        recommendation: hfResult.recommendation,
        survivalRisk: hfResult.survival_risk,
        carbonAbsorbed,
        waterLogs,
        isMock: false,
      })
      .returning();

    req.log.info({ treeId: saved.treeId }, "Tree record saved to database");
    res.json(saved);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Database insert failed");
    res.status(500).json({ error: `Failed to save analysis: ${msg}` });
  }
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
