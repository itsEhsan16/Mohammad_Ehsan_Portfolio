export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="section-spacing-sm border-t border-border/50 mt-16 sm:mt-20 lg:mt-24">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground">© {currentYear} Mohammad Ehsan. All rights reserved.</p>
          <p className="text-muted-foreground">Built with Next.js and Tailwind CSS</p>
        </div>
      </div>
    </footer>
  )
}
