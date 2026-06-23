import { motion } from "framer-motion";
import { Globe, Leaf } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90 z-10" />
        <img
          src="/hero-canopy.png"
          alt="Lush forest canopy"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container relative z-20 px-4 py-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="flex gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium shadow-sm backdrop-blur-sm">
              <Globe className="w-5 h-5" />
              <span>SDG 13: Climate Action</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium shadow-sm backdrop-blur-sm">
              <Leaf className="w-5 h-5" />
              <span>SDG 15: Life on Land</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight">
            AI Tree Guardian Network
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl font-sans mb-12">
            Harnessing AI to protect, monitor, and restore the world's trees — one upload at a time.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            <a
              href="#upload"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-full hover-elevate hover-elevate-2 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Monitoring
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}