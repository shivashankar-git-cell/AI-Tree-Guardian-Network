import { motion } from "framer-motion";
import { Leaf, Droplets, AlertTriangle, ShieldCheck, BadgeInfo, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface WaterLog {
  date: string;
  liters: number;
}

export interface PassportData {
  treeId: string;
  species: string;
  healthScore: number;
  possibleIssue: string;
  recommendation: string;
  survivalRisk: string;
  carbonAbsorbed: number;
  waterLogs: WaterLog[];
  isMock?: boolean;
  createdAt?: string;
}

interface TreePassportProps {
  imageUrl: string | null;
  data: PassportData | null;
}

function getRiskBadgeClass(risk: string) {
  const r = risk?.toLowerCase();
  if (r === "low") return "bg-green-500 hover:bg-green-600 text-white";
  if (r === "high") return "bg-red-500 hover:bg-red-600 text-white";
  return "bg-yellow-500 hover:bg-yellow-600 text-white";
}

function getHealthBarClass(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 45) return "bg-yellow-500";
  return "bg-red-500";
}

function WaterChart({ logs }: { logs: WaterLog[] }) {
  const max = Math.max(...logs.map((l) => l.liters), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-20">
        {logs.map((log) => {
          const pct = (log.liters / max) * 100;
          const shortDate = new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <div key={log.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end" style={{ height: "64px" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="w-full bg-blue-400 dark:bg-blue-500 rounded-t group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors"
                />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {log.liters}L
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground leading-none">{shortDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TreePassport({ imageUrl, data }: TreePassportProps) {
  if (!data) return null;

  const healthScore = Math.min(100, Math.max(0, data.healthScore));
  const avgWater =
    data.waterLogs.length > 0
      ? (data.waterLogs.reduce((s, l) => s + l.liters, 0) / data.waterLogs.length).toFixed(1)
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.25 }}
    >
        <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-card h-full">
          {/* Header */}
          <div className="bg-primary/5 border-b border-primary/10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-sm mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>OFFICIAL RECORD · SAVED TO DATABASE</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground">Digital Tree Passport</h2>
            </div>
            <div className="text-right bg-background p-3 rounded-lg border border-border shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Tree ID</p>
              <p
                className="font-mono text-lg font-bold text-foreground tracking-widest"
                data-testid="text-tree-id"
              >
                {data.treeId}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left column: photo */}
            <div className="md:col-span-5 space-y-6">
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-inner relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="Uploaded tree" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Leaf className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-xs font-mono px-2 py-1 rounded shadow text-foreground">
                  SCAN: OK
                </div>
              </div>

              {/* Eco metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Leaf className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase font-medium">Carbon</span>
                  </div>
                  <p className="text-xl font-bold text-foreground" data-testid="text-carbon">
                    {data.carbonAbsorbed}
                    <span className="text-xs font-normal text-muted-foreground ml-1">kg CO₂/yr</span>
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center dark:bg-blue-900/20 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-xs uppercase font-medium">Avg Water</span>
                  </div>
                  <p className="text-xl font-bold text-foreground" data-testid="text-water">
                    ~{avgWater}
                    <span className="text-xs font-normal text-muted-foreground ml-1">L/day</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: details */}
            <div className="md:col-span-7 space-y-7">
              {/* Species */}
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Species</p>
                <h3 className="text-2xl font-bold font-serif text-foreground" data-testid="text-species">
                  {data.species}
                </h3>
              </div>

              {/* Health score */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Health Score
                  </p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-health-score">
                    {healthScore}
                    <span className="text-muted-foreground text-sm font-normal">/100</span>
                  </p>
                </div>
                <div className="h-4 w-full bg-secondary/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${getHealthBarClass(healthScore)}`}
                  />
                </div>
              </div>

              {/* Issues */}
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Detected Issues
                </p>
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50 py-1.5 px-3"
                  data-testid="badge-issue"
                >
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  {data.possibleIssue}
                </Badge>
              </div>

              {/* Recommendation */}
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Recommendation
                </p>
                <div
                  className="flex items-start gap-2 text-sm text-foreground bg-secondary/10 p-3 rounded-lg border border-border"
                  data-testid="text-recommendation"
                >
                  <BadgeInfo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{data.recommendation}</span>
                </div>
              </div>

              {/* Water consumption chart */}
              {data.waterLogs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Water Consumption — Last 7 Days
                    </p>
                  </div>
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 p-4">
                    <WaterChart logs={data.waterLogs} />
                  </div>
                </div>
              )}

              {/* Survival risk */}
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Survival Risk
                </span>
                <Badge
                  className={`font-bold px-4 py-1.5 uppercase tracking-wide text-sm ${getRiskBadgeClass(data.survivalRisk)}`}
                  data-testid="badge-survival-risk"
                >
                  {data.survivalRisk} RISK
                </Badge>
              </div>
            </div>
          </div>
        </Card>
    </motion.div>
  );
}
