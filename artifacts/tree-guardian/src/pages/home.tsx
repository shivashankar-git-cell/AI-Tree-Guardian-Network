import { useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { UploadSection } from "@/components/home/UploadSection";
import { TreePassport, type PassportData } from "@/components/home/TreePassport";
import { ImpactSection } from "@/components/home/ImpactSection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (imageBase64: string, file: File) => {
    setImageUrl(imageBase64);
    setIsAnalyzing(true);
    setPassportData(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = (await response.json()) as PassportData & { isMock?: boolean };
      setPassportData(data);
    } catch (err) {
      setError("Analysis failed. Showing sample data.");
      setPassportData({
        treeId: `TRE-${new Date().getFullYear()}-00001`,
        species: "Azadirachta indica (Neem)",
        health_score: 62,
        possible_issue: "Heat stress and soil moisture deficit",
        recommendation:
          "Water deeply every 2–3 days in the early morning. Apply organic mulch around the base to retain moisture during Hyderabad's hot summers.",
        survival_risk: "Medium",
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        const el = document.getElementById("passport");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <HeroSection />
      <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      {error && (
        <div className="container max-w-4xl mx-auto px-4 pt-6">
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40">
            {error}
          </p>
        </div>
      )}
      <TreePassport isVisible={!!passportData} imageUrl={imageUrl} data={passportData} />
      <ImpactSection />
      <Footer />
    </div>
  );
}
