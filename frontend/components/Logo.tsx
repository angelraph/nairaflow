import Image from "next/image";

// The real NairaFlow logo, cut out of the brand artwork as transparent PNGs in /public/brand.
// Aspect ratios: mark 446x344, wordmark 835x134. Heights come from classes so they can shrink on phones.
export function LogoMark({ height = 32, className, priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/mark-640.png"
      alt=""
      width={Math.round((446 / 344) * height)}
      height={height}
      priority={priority}
      className={`w-auto ${className ?? ""}`}
      style={className ? undefined : { height }}
    />
  );
}

export function Wordmark({ height = 22, className, priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/wordmark-900.png"
      alt="NairaFlow"
      width={Math.round((835 / 134) * height)}
      height={height}
      priority={priority}
      className={`w-auto ${className ?? ""}`}
      style={className ? undefined : { height }}
    />
  );
}

// Mark and wordmark side by side, for the header and footer.
export function Logo({ size = "md", priority = false }: { size?: "md" | "lg"; priority?: boolean }) {
  const lg = size === "lg";
  return (
    <span className="flex items-center gap-2.5 sm:gap-3">
      <LogoMark height={lg ? 44 : 32} className={lg ? "h-9 sm:h-11" : "h-7 sm:h-8"} priority={priority} />
      <Wordmark height={lg ? 28 : 21} className={lg ? "h-6 sm:h-7" : "h-[17px] sm:h-[21px]"} priority={priority} />
    </span>
  );
}
