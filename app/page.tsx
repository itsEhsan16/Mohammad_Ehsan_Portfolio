import { Hero } from "@/components/home/Hero";
import { StageFallback } from "@/components/home/StageFallback";
import { Intro } from "@/components/home/Intro";
import { WorkReel } from "@/components/home/WorkReel";
import { Capabilities } from "@/components/services/Capabilities";
import { Experience } from "@/components/about/Experience";
import { heroFigure, resolvedProjects } from "@/lib/media";

export default function Home() {
  const projects = resolvedProjects();
  const figure = heroFigure();
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero figure={figure} fallback={<StageFallback still={figure.still} />} />
      <Intro />
      <WorkReel projects={projects} />
      <Capabilities index="03" />
      <Experience index="04" />
    </main>
  );
}
