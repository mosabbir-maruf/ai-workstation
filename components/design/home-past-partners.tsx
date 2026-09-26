import Link from "fumadocs-core/link";
import { pastPartners } from "@/lib/partners";

export function HomePastPartners() {
  if (pastPartners.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-10 pb-2">
      <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
        Past partners
      </p>
      <nav
        aria-label="Past partners"
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
      >
        {pastPartners.map((partner) => (
          <Link
            className="font-mono text-muted-foreground text-xs uppercase tracking-widest no-underline transition-colors hover:text-foreground"
            external
            href={partner.href}
            key={partner.id}
          >
            {partner.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
