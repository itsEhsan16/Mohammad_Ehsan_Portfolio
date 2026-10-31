"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Project } from "@/content/types";
import { statusLabel } from "@/content/projects";
import { useGLPlane, type PlaneVariant } from "@/lib/gl/useGLPlane";
import { cn } from "@/lib/utils";

/**
 * Project visual. Renders the cover image (or a procedural "blueprint card"
 * when no cover exists yet) as real DOM, then hands it to the WebGL layer,
 * which draws the blueprint → render shader on top and hides the DOM copy.
 */
export function ProjectMedia({
  project,
  variant = "blueprint",
  className,
  priority,
  sizes = "(min-width: 1024px) 60vw, 100vw",
  rounded = true,
  sync = "cached",
  morphKey,
  gl = true,
}: {
  /** Set false for DOM-only copies (e.g. hidden hover previews) so WebGL doesn't draw them. */
  gl?: boolean;
  project: Project;
  variant?: PlaneVariant;
  sync?: "cached" | "live";
  morphKey?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  rounded?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGLPlane(ref, {
    src: project.cover?.src,
    title: project.title,
    index: project.index,
    kind: project.kind,
    variant,
    sync,
    morphKey,
    enabled: gl,
  });

  return (
    <div
      ref={ref}
      data-gl-plane={gl ? "" : undefined}
      className={cn("relative aspect-[16/10] w-full overflow-hidden bg-surface", rounded && "rounded-[6px]", className)}
    >
      <div className="gl-media absolute inset-0">
        {project.cover ? (
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            sizes={sizes}
            priority={priority}
            quality={85}
            className="object-cover"
          />
        ) : (
          <BlueprintCard project={project} />
        )}
      </div>
      <Corners />
    </div>
  );
}

/** Procedural placeholder in the site's blueprint language: grid, crosshairs and a halftone title. */
export function BlueprintCard({ project }: { project: Project }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-[4%] text-fg [container-type:size]"
      style={{
        backgroundColor: "var(--surface)",
        backgroundImage:
          "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
      role="img"
      aria-label={`${project.title} — blueprint placeholder`}
    >
      <div className="t-label flex justify-between text-[10px] text-muted">
        <span>N°{String(project.index).padStart(2, "0")} — {project.kind}</span>
        <span>{statusLabel[project.status]}</span>
      </div>
      <p
        className="t-display mx-auto max-w-[92%] text-center text-[clamp(1.6rem,12.5cqw,9rem)] leading-[0.86]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--fg) 1.3px, transparent 1.6px)",
          backgroundSize: "7px 7px",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        {project.title}
      </p>
      <div className="t-label flex items-center justify-between text-[10px] text-muted">
        <span className="flex items-center gap-2">
          <span className="h-px w-8 bg-signal" /> Blueprint // render pending
        </span>
        <span>{project.stack.slice(0, 3).join(" · ")}</span>
      </div>
    </div>
  );
}

function Corners() {
  const c = "absolute h-3 w-3 border-fg/60";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-2">
      <span className={cn(c, "left-0 top-0 border-l border-t")} />
      <span className={cn(c, "right-0 top-0 border-r border-t")} />
      <span className={cn(c, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(c, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}
