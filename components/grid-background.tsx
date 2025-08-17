"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import dynamic from "next/dynamic";

interface GridBackgroundProps {
  className?: string;
}

function GridBackgroundComponent({ className = "" }: GridBackgroundProps) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Create transforms outside of the mapping function
  const createTransforms = (row: number, col: number) => {
    return {
      scale: useTransform([mouseX, mouseY], (latest: number[]) => {
        const deltaX = latest[0] - col / 7;
        const deltaY = latest[1] - row / 7;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return 1 - dist * 0.6;
      }),
      opacity: useTransform([mouseX, mouseY], (latest: number[]) => {
        const deltaX = latest[0] - col / 7;
        const deltaY = latest[1] - row / 7;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return 1 - dist * 0.8;
      })
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document
        .getElementById("grid-container")
        ?.getBoundingClientRect();
      if (!rect) return;

      const xPos = (e.clientX - rect.left) / rect.width;
      const yPos = (e.clientY - rect.top) / rect.height;

      mouseX.set(xPos);
      mouseY.set(yPos);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div id="grid-container" className={`w-full h-full ${className}`}>
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-2">
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;

          const { scale, opacity } = createTransforms(row, col);
          return (
            <motion.div
              key={i}
              className="border border-white/50 w-full h-full"
              style={{ scale, opacity }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Wrap with dynamic to disable SSR
export default dynamic(() => Promise.resolve(GridBackgroundComponent), {
  ssr: false,
});
