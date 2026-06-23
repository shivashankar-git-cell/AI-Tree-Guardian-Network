import { motion } from "framer-motion";
import { Leaf, Droplets, AlertTriangle, ShieldCheck, Activity, ShieldAlert, BadgeInfo } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TreePassportProps {
  isVisible: boolean;
  imageUrl: string | null;
}

export function TreePassport({ isVisible, imageUrl }: TreePassportProps) {
  if (!isVisible) return null;

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      className="py-12 bg-background"
      id="passport"
    >
      <div className="container px-4 max-w-4xl mx-auto">
        <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-card">
          <div className="bg-primary/5 border-b border-primary/10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-sm mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>OFFICIAL RECORD</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground">Digital Tree Passport</h2>
            </div>
            <div className="text-right bg-background p-3 rounded-lg border border-border shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Tree ID</p>
              <p className="font-mono text-lg font-bold text-foreground">TRE-2024-00847</p>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-6">
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-inner relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="Tree" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Leaf className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-xs font-mono px-2 py-1 rounded shadow text-foreground">
                  SCAN: OK
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Species</p>
                <h3 className="text-2xl font-bold font-serif text-foreground">Quercus robur</h3>
                <p className="text-lg text-muted-foreground italic">English Oak</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Health Score</p>
                  <p className="text-2xl font-bold text-foreground">78<span className="text-muted-foreground text-sm font-normal">/100</span></p>
                </div>
                <div className="h-4 w-full bg-secondary/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${getHealthColor(78)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Leaf className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase font-medium">Carbon Absorbed</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">~48.3 <span className="text-sm font-normal text-muted-foreground">kg CO₂/yr</span></p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center dark:bg-blue-900/20 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-xs uppercase font-medium">Water Req.</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">~12 <span className="text-sm font-normal text-muted-foreground">L/day</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Detected Issues</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50 py-1.5 px-3">
                      <AlertTriangle className="w-3 h-3 mr-1.5" /> Bark discoloration
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50 py-1.5 px-3">
                      <AlertTriangle className="w-3 h-3 mr-1.5" /> Mild leaf curl
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommendations</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-foreground bg-secondary/10 p-2.5 rounded-lg border border-border">
                      <BadgeInfo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Increase watering frequency by 20% during dry spells.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground bg-secondary/10 p-2.5 rounded-lg border border-border">
                      <BadgeInfo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Apply organic slow-release fertilizer around the drip line.</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Survival Risk</span>
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-1">MEDIUM RISK</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </motion.section>
  );
}