"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[560px] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-medium tracking-tight text-ink">Something went wrong.</h1>
      <p className="leading-relaxed text-slate">
        Nothing was sent to the chain and no funds moved. Try again, and if it keeps happening, go back to the home page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
