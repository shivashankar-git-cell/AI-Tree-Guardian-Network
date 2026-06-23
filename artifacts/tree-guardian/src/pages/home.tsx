import { useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { UploadSection } from "@/components/home/UploadSection";
import { TreePassport } from "@/components/home/TreePassport";
import { ImpactSection } from "@/components/home/ImpactSection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [passportVisible, setPassportVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAnalyze = (url: string) => {
    setImageUrl(url);
    setIsAnalyzing(true);
    setPassportVisible(false);
    
    // Mock analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setPassportVisible(true);
      
      // Scroll to passport
      setTimeout(() => {
        const el = document.getElementById("passport");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <HeroSection />
      <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      <TreePassport isVisible={passportVisible} imageUrl={imageUrl} />
      <ImpactSection />
      <Footer />
    </div>
  );
}