import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";
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

async function compressImage(dataUrl: string): Promise<{ data: string; mimeType: string }> {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) throw new Error("Invalid image data URL");
  const base64Data = dataUrl.slice(commaIdx + 1);
  const inputBuffer = Buffer.from(base64Data, "base64");

  const outputBuffer = await sharp(inputBuffer)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return { data: outputBuffer.toString("base64"), mimeType: "image/jpeg" };
}

// ─── Parse helpers ───────────────────────────────────────────────────────────

function parseCarbonNumber(carbonStr: string | number): number {
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
  "You are a professional arborist. Analyze this image carefully. " +
  "Return ONLY a valid JSON object with no markdown formatting or backticks. The JSON must contain:\n" +
  "species: Exact common and scientific name of the plant.\n" +
  "health_score: Precise number from 0-100 based on visible health.\n" +
  "possible_issue: Real botanical issues or 'None' if perfectly healthy.\n" +
  "recommendation: Exact care instructions customized for the hot, semi-arid climate of Hyderabad, India.\n" +
  "survival_risk: High, Medium, or Low.\n" +
  "carbon_absorbed: Realistic annual estimate in kg/year based on plant type and size.\n" +
  "water_requirement_liters_per_day: Precise water needs calculated specifically on whether this is a small potted plant or a large ground tree.";

// ─── POST /api/analyze-tree ──────────────────────────────────────────────────

router.post("/analyze-tree", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY environment variable is not set");
    res.status(500).json({ error: "Server configuration error: GEMINI_API_KEY is missing" });
    return;
  }

  // Compress image before sending to Gemini
  let compressed: { data: string; mimeType: string };
  try {
    compressed = await compressImage(imageBase64);
    req.log.info("Image compressed successfully");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Image compression failed");
    res.status(500).json({ error: `Image processing failed: ${msg}` });
    return;
  }

  // Call Gemini vision model
  let hfResult: {
    species: string;
    health_score: number;
    possible_issue: string;
    recommendation: string;
    survival_risk: string;
    carbon_absorbed: string | number;
    water_requirement_liters_per_day: number;
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: compressed.mimeType, data: compressed.data } },
            { text: SYSTEM_PROMPT },
          ],
        },
      ],
    });

    const rawText = response.text ?? "";
    req.log.info({ rawText }, "Gemini model raw response");

    // Strip markdown fences if present
    const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return a JSON object");

    hfResult = JSON.parse(match[0]);

    const required = [
      "species",
      "health_score",
      "possible_issue",
      "recommendation",
      "survival_risk",
      "carbon_absorbed",
      "water_requirement_liters_per_day",
    ];
    for (const key of required) {
      if (!(key in hfResult)) throw new Error(`Missing key in AI response: "${key}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Gemini inference failed");
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
