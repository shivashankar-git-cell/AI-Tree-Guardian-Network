import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSection } from "@/components/home/HeroSection";
import { UploadSection } from "@/components/home/UploadSection";
import { TreePassport, type PassportData } from "@/components/home/TreePassport";
import { TreeDoctorBot } from "@/components/home/TreeDoctorBot";
import { ImpactSection } from "@/components/home/ImpactSection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAnalyze = async (imageBase64: string, _file: File) => {
    setImageUrl(imageBase64);
    setIsAnalyzing(true);
    setPassportData(null);

    try {
      const response = await fetch("/api/analyze-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = (await response.json()) as PassportData;
      setPassportData(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setPassportData({
        treeId: "TREE-DEMO",
        species: "Azadirachta indica (Neem)",
        healthScore: 62,
        possibleIssue: "Heat stress and soil moisture deficit",
        recommendation:
          "Water deeply every 2–3 days in the early morning. Apply organic mulch around the base during Hyderabad's hot summers.",
        survivalRisk: "Medium",
        carbonAbsorbed: 22,
        waterLogs: Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return { date: d.toISOString().split("T")[0], liters: 10 + i };
        }),
        isMock: true,
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        const el = document.getElementById("tree-analysis");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <HeroSection />
      <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

      <AnimatePresence>
        {passportData && (
          <motion.section
            key="tree-analysis"
            id="tree-analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="py-12 bg-background"
          >
            <div className="container px-4 max-w-7xl mx-auto">
              {passportData.isMock && (
                <div className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40">
                  Showing sample data — AI analysis was unavailable. Results have been saved.
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Digital Tree Passport */}
                <TreePassport imageUrl={imageUrl} data={passportData} />

                {/* Tree Doctor Bot */}
                <div className="xl:sticky xl:top-8">
                  <TreeDoctorBot passportData={passportData} />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <ImpactSection />
      <Footer />
    </div>
  );
}
