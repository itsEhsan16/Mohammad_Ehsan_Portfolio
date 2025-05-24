export function SectionTitleFallback({ title, number }) {
  return (
    <h2 className="text-3xl font-bold mb-2">
      <span className="font-mono text-primary">{number} // </span>
      {title}
    </h2>
  )
}
