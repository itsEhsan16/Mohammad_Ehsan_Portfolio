import { cn } from "@/lib/utils";

/** `02 // SELECTED WORK (05)` — the mono section index carried over from v1. */
export function SectionLabel({
  index,
  title,
  count,
  className,
  id,
}: {
  index: string;
  title: string;
  count?: number;
  className?: string;
  id?: string;
}) {
  return (
    <p id={id} className={cn("t-label flex items-center gap-2 text-muted", className)}>
      <span className="text-signal-text">{index}</span>
      <span aria-hidden="true">{"//"}</span>
      <span className="text-fg/85">{title}</span>
      {typeof count === "number" && <span className="text-muted">({String(count).padStart(2, "0")})</span>}
    </p>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "t-label inline-flex items-center rounded-full border border-line px-2.5 py-1 text-[10px] text-fg/80",
        className,
      )}
    >
      {children}
    </span>
  );
}
