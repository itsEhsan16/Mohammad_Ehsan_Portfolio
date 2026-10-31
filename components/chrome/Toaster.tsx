"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };
let seq = 0;
const listeners = new Set<(t: Toast) => void>();

/** Fire-and-forget toast from anywhere. */
export function toast(message: string) {
  const t = { id: ++seq, message };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const add = (t: Toast) => {
      setItems((prev) => [...prev.slice(-2), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== t.id)), 2600);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex flex-col items-center gap-2 px-gutter"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="t-label motion-safe:animate-[toast-in_.5s_var(--ease-expo)] rounded-full bg-fg px-4 py-2 text-[11px] text-bg shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
