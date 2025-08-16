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
      
      {/* Add spacing between major sections */}
      <div className="space-y-16 sm:space-y-20 lg:space-y-24">
        <Expertise />
        <Projects />
        <Experience />
        <Contact />
      </div>
      
      <Footer />
      <VerticalNav />
    </main>
  )
}
