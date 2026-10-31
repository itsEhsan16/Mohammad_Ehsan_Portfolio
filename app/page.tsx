import { site } from "@/content/site";

export default function Home() {
  return (
    <main className="px-gutter py-24">
      <p className="t-label text-muted">01 // index</p>
      <h1 className="t-display text-giant">{site.lastName}</h1>
      <p className="t-serif text-4xl">{site.role}</p>
    </main>
  );
}
