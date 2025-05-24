export function SectionTitle({ title, number }: { title: string; number: string }) {
  return (
    <h2 className="text-3xl font-bold mb-2">
      <span className="font-mono text-primary">{number} // </span>
      {title}
    </h2>
  )
}
