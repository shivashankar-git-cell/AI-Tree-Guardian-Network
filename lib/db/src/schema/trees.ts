import { pgTable, serial, text, integer, real, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waterLogSchema = z.object({
  date: z.string(),
  liters: z.number(),
});
export type WaterLog = z.infer<typeof waterLogSchema>;

export const treesTable = pgTable("trees", {
  id: serial("id").primaryKey(),
  treeId: text("tree_id").notNull().unique(),
  species: text("species").notNull(),
  healthScore: integer("health_score").notNull(),
  possibleIssue: text("possible_issue").notNull(),
  recommendation: text("recommendation").notNull(),
  survivalRisk: text("survival_risk").notNull(),
  carbonAbsorbed: real("carbon_absorbed").notNull(),
  waterLogs: jsonb("water_logs").$type<WaterLog[]>().notNull().default([]),
  isMock: boolean("is_mock").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTreeSchema = createInsertSchema(treesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTree = z.infer<typeof insertTreeSchema>;
export type Tree = typeof treesTable.$inferSelect;
