"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import GridBackground from "./grid-background";

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Interactive grid background */}
      {mounted && <GridBackground className="absolute inset-0" />}

      {/* Fallback background that's always shown */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter mb-4">
              Mohammad Ehsan
            </h1>
            <h2 className="text-lg md:text-xl font-mono text-muted-foreground tracking-wide mb-8">
              SOFTWARE ENGINEER, FRONT END DEVELOPER.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Building digital experiences that combine creativity with
              technical excellence. Focused on creating intuitive,
              high-performance applications.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
