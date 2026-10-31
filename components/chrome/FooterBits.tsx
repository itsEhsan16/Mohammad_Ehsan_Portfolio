"use client";

import { site } from "@/content/site";
import { useLocalTime } from "@/lib/time";
import { chime } from "@/lib/audio";
import { scrollTo } from "@/lib/motion/lenis";
import { toast } from "./Toaster";
import { Icon } from "@/components/ui/Icon";

export function LocalTime() {
  const t = useLocalTime(false);
  return <span className="tabular-nums">{t}</span>;
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(site.email);
    toast("Email copied — talk soon");
  } catch {
    window.location.href = `mailto:${site.email}`;
    return;
  }
  chime();
}

export function CopyEmail() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={`mailto:${site.email}`}
        data-cursor="copy"
        onClick={(e) => {
          if (!window.matchMedia("(pointer: fine)").matches) return; // phones: open the mail app
          e.preventDefault();
          void copyEmail();
        }}
        className="group relative text-[clamp(1.25rem,2.5vw,2.35rem)] font-medium leading-none tracking-tight [overflow-wrap:anywhere]"
      >
        {site.email}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-signal transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-x-100" />
      </a>
      <button
        type="button"
        onClick={() => void copyEmail()}
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-fg/80 transition-colors hover:text-fg"
        aria-label="Copy email address"
      >
        <Icon name="copy" size={14} />
      </button>
    </div>
  );
}

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => scrollTo(0)}
      className="inline-flex items-center gap-1.5 text-fg/80 transition-colors hover:text-fg"
    >
      Back to top <Icon name="arrow-up" size={12} />
    </button>
  );
}
