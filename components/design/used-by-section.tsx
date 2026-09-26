import { UsedByLogoGrid } from "@/components/design/used-by-logo-grid";
import { cn } from "@/lib/utils";

export function UsedBySection({ className }: { className?: string }) {
  return (
    <section
      aria-label="Ecosystem partners"
      className={cn(
        "container mx-auto px-4 py-10 text-left sm:py-16",
        className
      )}
    >
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="font-mono font-semibold text-foreground text-xs uppercase tracking-widest">
          Ecosystem partners
        </h2>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
          Backed by open infrastructure and platform partners
          <span className="animate-caret-blink">_</span>
        </p>
      </div>
      <UsedByLogoGrid />
    </section>
  );
}
