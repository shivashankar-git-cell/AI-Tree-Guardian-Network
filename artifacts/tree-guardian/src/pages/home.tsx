import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = async (imageBase64: string, _file: File) => {
    setImageUrl(imageBase64);
    setIsAnalyzing(true);
    setPassportData(null);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? `Server error: ${response.status}`);
      }

      const data = (await response.json()) as PassportData;
      setPassportData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setAnalysisError(`AI Analysis Failed: ${msg}`);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        const target = document.getElementById("tree-analysis") ?? document.getElementById("analysis-error");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <HeroSection />
      <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

      {/* Error banner */}
      <AnimatePresence>
        {analysisError && !passportData && (
          <motion.div
            id="analysis-error"
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="container px-4 max-w-4xl mx-auto mt-8"
          >
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-300">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Analysis Failed</p>
                <p className="text-sm mt-0.5">{analysisError}</p>
                <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                  Please try again with a clear, well-lit photo of the tree or plant.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passport + chat panel */}
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <TreePassport imageUrl={imageUrl} data={passportData} />
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
