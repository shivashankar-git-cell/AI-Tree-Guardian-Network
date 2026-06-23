import { motion } from "framer-motion";

const stats = [
  { label: "Trees Monitored", value: "24,892", suffix: "" },
  { label: "CO₂ Absorbed", value: "1.2M", suffix: "kg" },
  { label: "Active Countries", value: "48", suffix: "" },
  { label: "Species Catalogued", value: "1,403", suffix: "" },
];

export function ImpactSection() {
  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="container px-4 relative z-10 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Global Network Impact</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            Together, our community is creating the largest living database of the world's tree canopy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2 tracking-tight">
                {stat.value}<span className="text-2xl md:text-3xl text-primary-foreground/70 font-sans ml-1">{stat.suffix}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-primary-foreground/80 uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}