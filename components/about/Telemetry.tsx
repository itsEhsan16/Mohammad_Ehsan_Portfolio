"use client";

import { site } from "@/content/site";
import { experience } from "@/content/experience";
import { useLocalTime } from "@/lib/time";

const sha = process.env.NEXT_PUBLIC_BUILD_SHA || "local";

/** "Telemetry" card — live facts in HUD language (Carter-style), all from content. */
export function Telemetry() {
  const time = useLocalTime(true);
  const current = experience.find((r) => r.current && r.company !== "Freelancing");
  const rows: [string, React.ReactNode][] = [
    ["Local", <span key="t" className="tabular-nums">{time} {site.location.tzLabel}</span>],
    ["Base", `${site.location.country} · UTC+05:30`],
    ["Role", current ? `${current.title} @ ${current.company}` : site.roleShort],
    ["Freelance", site.availability.open ? "Open" : "Booked"],
    ["Stack", "React · Next.js · TypeScript"],
    ["Since", String(site.since)],
    ["Site", `v2.0 · build ${sha}`],
  ];
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-line bg-surface p-5">
      <div className="t-label flex items-center justify-between text-[10px] text-muted">
        <span>Telemetry::</span>
        <span className="flex items-center gap-2 text-fg/85">
          <span className="live-dot" /> Live
        </span>
      </div>
      <dl className="mt-4 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="t-label flex items-baseline justify-between gap-4 py-2.5 text-[11px]">
            <dt className="text-muted">{k}::</dt>
            <dd className="text-right text-fg/90">{v}</dd>
          </div>
        ))}
      </dl>
      {/* dot-matrix strip */}
      <div
        aria-hidden="true"
        className="mt-4 h-14 rounded-[4px] opacity-70"
        style={{
          backgroundImage: "radial-gradient(circle, var(--fg) 1px, transparent 1.4px)",
          backgroundSize: "6px 6px",
          maskImage: "linear-gradient(90deg, transparent, #000 20%, #000 60%, transparent)",
        }}
      />
    </div>
  );
}
