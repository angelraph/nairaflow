import Link from "next/link";

export function NotFoundNote({ what, reason, backHref, backLabel }: { what: string; reason: string; backHref: string; backLabel: string }) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[560px] flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-3xl font-medium tracking-tight text-ink">We could not open this {what}.</h1>
      <p className="leading-relaxed text-slate">{reason}</p>
      <Link href={backHref} className="btn-primary">
        {backLabel}
      </Link>
    </div>
  );
}
