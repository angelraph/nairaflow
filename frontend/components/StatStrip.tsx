// Aave-style header strip: big numerals with a muted label under each.
export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-5">
      {items.map((item) => (
        <div key={item.label}>
          <dd className="num text-2xl text-ink sm:text-3xl">{item.value}</dd>
          <dt className="mt-1 text-xs tracking-wide text-slate">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
