import Image from "next/image";

// The real NairaFlow logo, cut out of the brand artwork as transparent PNGs in /public/brand.
// Aspect ratios: mark 446x344, wordmark 835x134.
export function LogoMark({ height = 32, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src="/brand/mark-640.png"
      alt=""
      width={Math.round((446 / 344) * height)}
      height={height}
      priority={priority}
      className="w-auto"
      style={{ height }}
    />
  );
}

export function Wordmark({ height = 22, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src="/brand/wordmark-900.png"
      alt="NairaFlow"
      width={Math.round((835 / 134) * height)}
      height={height}
      priority={priority}
      className="w-auto"
      style={{ height }}
    />
  );
}

// Mark and wordmark side by side, for the header and footer.
export function Logo({ size = "md", priority = false }: { size?: "md" | "lg"; priority?: boolean }) {
  const mark = size === "lg" ? 44 : 32;
  const word = size === "lg" ? 28 : 21;
  return (
    <span className="flex items-center gap-3">
      <LogoMark height={mark} priority={priority} />
      <Wordmark height={word} priority={priority} />
    </span>
  );
}
