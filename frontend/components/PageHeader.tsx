import type { ReactNode } from "react";

// Shared page header: a small tag, a large title and a short description, with room for an action on the right.
export function PageHeader({
  tag,
  title,
  description,
  action,
}: {
  tag: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="hero-in flex flex-col gap-6 border-b border-sand pb-10 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-[680px] flex-col gap-4">
        <p className="tag">{tag}</p>
        <h1 className="text-4xl font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">{title}</h1>
        {description && <p className="leading-relaxed text-slate sm:text-lg">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
