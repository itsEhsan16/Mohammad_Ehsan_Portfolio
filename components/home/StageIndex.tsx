import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";

const NOTES: Record<string, string> = {
  "/work": `${projects.length} case studies`,
  "/about": "Story, stack, experience",
  "/services": site.availability.open ? "Open for freelance" : "How I work",
  "/contact": "Say hello",
};

/** The home stage's way in: a solid card on the ground, so it reads over the dithered terrain. */
export function StageIndex() {
  return (
    <nav aria-label="Index" className="rounded-[6px] bg-fg text-bg shadow-[0_24px_60px_-24px_rgba(0,0,0,.6)]">
      <p className="t-label flex items-center justify-between px-4 pb-1.5 pt-3 text-[10px] opacity-75">
        <span>Index</span>
        <span>{String(site.nav.length).padStart(2, "0")} pages</span>
      </p>
      <ul>
        {site.nav.map((l, i) => (
          <li key={l.href} className="border-t border-bg/15">
            <TransitionLink
              href={l.href}
              className="group grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 px-4 py-2 transition-colors hover:bg-signal hover:text-ink focus-visible:bg-signal focus-visible:text-ink"
            >
              <span className="t-label text-[10px] opacity-75 group-hover:opacity-100">{String(i + 1).padStart(2, "0")}</span>
              <span className="t-display text-[clamp(1.25rem,1.6vw,1.6rem)] leading-none">{l.label}</span>
              <span className="t-label hidden text-[10px] opacity-75 group-hover:opacity-100 sm:inline">{NOTES[l.href]}</span>
              <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
