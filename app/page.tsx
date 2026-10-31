import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { WorkReel } from "@/components/home/WorkReel";
import { Capabilities } from "@/components/home/Capabilities";
import { Services } from "@/components/home/Services";
import { Experience } from "@/components/home/Experience";
import { Contact } from "@/components/home/Contact";
import { resolvedProjects } from "@/lib/media";

export default function Home() {
  const projects = resolvedProjects();
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <Manifesto />
      <WorkReel projects={projects} />
      <Capabilities />
      <Services />
      <Experience />
      <Contact />
    </main>
  );
}
