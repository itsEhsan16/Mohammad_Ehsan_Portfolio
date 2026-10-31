import Image from "next/image";
import type { CaseBlock } from "@/content/types";
import { SplitReveal } from "@/components/ui/SplitReveal";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="t-label text-muted lg:sticky lg:top-32">{children}</p>;
}

function Block({ block, n }: { block: CaseBlock; n: number }) {
  const label = (
    <div className="col-span-12 lg:col-span-3">
      <Label>
        <span className="text-signal-text">{String(n).padStart(2, "0")}</span> {"//"} {block.label}
      </Label>
    </div>
  );

  switch (block.type) {
    case "text":
      return (
        <section className="grid grid-cols-12 gap-6 border-t border-line py-[clamp(3.5rem,7vw,6rem)]">
          {label}
          <div className="col-span-12 lg:col-span-8">
            {block.title && (
              <SplitReveal as="h2" type="lines" className="text-section max-w-[20ch] font-medium leading-[1.04] tracking-[-0.03em]">
                {block.title}
              </SplitReveal>
            )}
            <div className="mt-6 max-w-[62ch] space-y-5 text-[17px] leading-relaxed text-fg/85">
              {block.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      );
    case "features":
      return (
        <section className="grid grid-cols-12 gap-6 border-t border-line py-[clamp(3.5rem,7vw,6rem)]">
          {label}
          <ol className="col-span-12 grid grid-cols-1 gap-px overflow-hidden rounded-[6px] border border-line bg-line sm:grid-cols-2 lg:col-span-9">
            {block.items.map((f, i) => (
              <li key={f.title} className="bg-bg p-6">
                <span className="t-label text-signal-text">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[clamp(1.25rem,1.8vw,1.6rem)] font-medium leading-tight tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ol>
        </section>
      );
    case "stack":
      return (
        <section className="grid grid-cols-12 gap-6 border-t border-line py-[clamp(3.5rem,7vw,6rem)]">
          {label}
          <dl className="col-span-12 lg:col-span-9">
            {block.items.map((s) => (
              <div key={s.name} className="grid grid-cols-12 gap-4 border-b border-line py-5 first:pt-0">
                <dt className="t-display col-span-12 text-[clamp(1.6rem,2.6vw,2.6rem)] leading-none sm:col-span-5">{s.name}</dt>
                <dd className="col-span-12 text-[15px] leading-relaxed text-muted sm:col-span-7">{s.why}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "gallery":
      return (
        <section className="grid grid-cols-12 gap-6 border-t border-line py-[clamp(3.5rem,7vw,6rem)]">
          {label}
          <div className="col-span-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-9">
            {block.images.map((img, i) => (
              <figure key={img.src} className={i === 0 ? "md:col-span-2" : ""}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-surface">
                  <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
                </div>
                {img.caption && <figcaption className="t-label mt-3 text-muted">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      );
    case "stats":
      return (
        <section className="grid grid-cols-12 gap-6 border-t border-line py-[clamp(3.5rem,7vw,6rem)]">
          {label}
          <dl className="col-span-12 grid grid-cols-2 gap-6 lg:col-span-9 lg:grid-cols-3">
            {block.items.map((s) => (
              <div key={s.label}>
                <dt className="t-label text-muted">{s.label}</dt>
                <dd className="t-display mt-2 text-[clamp(3rem,6vw,6rem)] leading-none">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "status":
      return (
        <section className="grid grid-cols-12 gap-6 border-t border-line py-[clamp(3.5rem,7vw,6rem)]">
          {label}
          <div className="col-span-12 rounded-[6px] border border-dashed border-signal/50 p-6 lg:col-span-8">
            <p className="t-label flex items-center gap-2 text-signal-text">
              <span className="live-dot !bg-signal" /> In development
            </p>
            {block.title && <h2 className="t-display mt-4 text-[clamp(2.2rem,4vw,4rem)] leading-[0.9]">{block.title}</h2>}
            <div className="mt-4 space-y-3 text-[16px] leading-relaxed text-fg/85">
              {block.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      );
  }
}

/** Renders a case study's content blocks (server component, exhaustive over CaseBlock). */
export function CaseBlocks({ blocks }: { blocks: CaseBlock[] }) {
  return (
    <div className="px-gutter">
      {blocks.map((b, i) => (
        <Block key={`${b.type}-${i}`} block={b} n={i + 1} />
      ))}
    </div>
  );
}
