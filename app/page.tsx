import { Header } from "@/components/header"
import { Expertise } from "@/components/expertise"
import { Projects } from "@/components/projects"
import { Experience } from "@/components/experience"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { VerticalNav } from "@/components/vertical-nav"
import HeroClientWrapper from "@/components/DynamicHero"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroClientWrapper />
      <Expertise />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
      <VerticalNav />
    </main>
  )
}
