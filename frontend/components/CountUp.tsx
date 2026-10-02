"use client";

import { useEffect, useState } from "react";

// Counts up to a number read from the chain. With reduced motion it simply shows the number.
export function CountUp({ value }: { value: number | undefined }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (value === undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (value === undefined) return <span className="text-slate">...</span>;
  return <>{shown.toLocaleString("en-US")}</>;
}
