import { Landmark } from "lucide-react";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 place-items-center rounded-[var(--gui-radius-s)] bg-[var(--gui-color-1)] text-[var(--gui-accent-text-accessible)] ${className}`}
    >
      <Landmark className="size-5" strokeWidth={1.8} />
    </span>
  );
}
