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
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl"
          >
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter mb-6 lg:mb-8 text-balance">
              Mohammad Ehsan
            </h1>
            <h2 className="text-lg md:text-xl lg:text-2xl font-mono text-muted-foreground tracking-wide mb-8 lg:mb-12">
              SOFTWARE ENGINEER, FRONT END DEVELOPER.
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Building digital experiences that combine creativity with
              technical excellence. Focused on creating intuitive,
              high-performance applications.
            </p>
            <motion.a
              href="https://drive.google.com/file/d/1TK7upHpmypxtoagJpmSsbNh1Ks9gdahO/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span>Resume</span>
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
