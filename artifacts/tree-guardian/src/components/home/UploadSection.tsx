import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadSectionProps {
  onAnalyze: (imageBase64: string, file: File) => void;
  isAnalyzing: boolean;
}

export function UploadSection({ onAnalyze, isAnalyzing }: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedImage && selectedFile) {
      onAnalyze(selectedImage, selectedFile);
    }
  };

  return (
    <section id="upload" className="py-24 bg-card">
      <div className="container px-4 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Upload a Tree Photo</h2>
          <p className="text-muted-foreground text-lg">
            Our AI will analyze your tree and generate its Digital Tree Passport.
          </p>
        </div>

        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
            ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border bg-background hover:border-primary/50"}
            ${selectedImage ? "p-0 border-solid" : "p-12"}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-testid="upload-dropzone"
        >
          <AnimatePresence mode="wait">
            {!selectedImage ? (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center pointer-events-none"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drag & Drop your photo</h3>
                <p className="text-muted-foreground mb-6">or click to browse from your device</p>

                <Button
                  onClick={() => inputRef.current?.click()}
                  size="lg"
                  className="pointer-events-auto shadow-md"
                  data-testid="button-select-photo"
                >
                  Select Photo
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="image-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full relative"
              >
                <img
                  src={selectedImage}
                  alt="Tree preview"
                  className="w-full h-[400px] object-cover rounded-xl"
                  data-testid="img-tree-preview"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                    onClick={clearImage}
                    disabled={isAnalyzing}
                    data-testid="button-clear-image"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                  <Button
                    size="lg"
                    className="w-full max-w-sm text-lg font-semibold shadow-xl"
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing || !selectedFile}
                    data-testid="button-analyze-tree"
                  >
                    {isAnalyzing ? (
                      <>
                        <Activity className="w-5 h-5 mr-2 animate-pulse" />
                        Compressing &amp; Analyzing Image...
                      </>
                    ) : (
                      "Analyze Tree"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            data-testid="input-file-upload"
          />
        </div>
      </div>
    </section>
  );
}
