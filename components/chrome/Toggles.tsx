"use client";

import { useApp, setState } from "@/lib/store";
import { toggleTheme } from "@/lib/theme";
import { setSound, tick } from "@/lib/audio";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const btn =
  "relative grid h-9 w-9 place-items-center rounded-full border border-line bg-bg/60 text-fg backdrop-blur-md transition-colors hover:border-fg/40";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useApp((s) => s.theme);
  return (
    <button
      type="button"
      className={cn(btn, className)}
      aria-label={theme === "ink" ? "Switch to paper (light) theme" : "Switch to ink (dark) theme"}
      data-cursor="hide"
      onMouseEnter={tick}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <Icon name={theme === "ink" ? "sun" : "moon"} size={15} />
    </button>
  );
}

export function SoundToggle({ className }: { className?: string }) {
  const sound = useApp((s) => s.sound);
  return (
    <button
      type="button"
      className={cn(btn, className)}
      aria-label={sound ? "Turn interface sounds off" : "Turn interface sounds on"}
      aria-pressed={sound}
      data-cursor="hide"
      onMouseEnter={tick}
      onClick={() => {
        setSound(!sound);
        setState({ sound: !sound });
      }}
    >
      <Icon name={sound ? "sound-on" : "sound-off"} size={15} />
      {sound && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-signal" />}
    </button>
  );
}
