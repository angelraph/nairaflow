import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[560px] flex-col items-center justify-center gap-6 text-center">
      <LogoMark height={56} />
      <h1 className="text-4xl font-medium tracking-tight text-ink">This page is not here.</h1>
      <p className="leading-relaxed text-slate">The link may be wrong, or the page has moved. Here is a good place to start.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/circles" className="btn-secondary">
          Browse circles
        </Link>
      </div>
    </div>
  );
}
