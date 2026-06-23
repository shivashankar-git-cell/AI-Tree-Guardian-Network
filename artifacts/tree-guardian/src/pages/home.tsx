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
      // Graceful fallback with camelCase keys matching PassportData
      setPassportData({
        treeId: `TREE-DEMO`,
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
        const el = document.getElementById("passport");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <HeroSection />
      <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      <TreePassport isVisible={!!passportData} imageUrl={imageUrl} data={passportData} />
      <ImpactSection />
      <Footer />
    </div>
  );
}
