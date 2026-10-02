import Link from "next/link";

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card flex h-[210px] animate-pulse flex-col justify-between">
          <div className="h-3 w-24 rounded-full bg-white/10" />
          <div className="h-9 w-40 rounded-full bg-white/10" />
          <div className="h-2 w-full rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="card flex flex-col items-start gap-4 py-10 sm:items-center sm:text-center">
      <p className="text-2xl tracking-tight text-ink">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-slate">{body}</p>
      <Link href={href} className="btn-primary">
        {cta}
      </Link>
    </div>
  );
}
