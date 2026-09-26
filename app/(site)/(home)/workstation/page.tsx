import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeFooter } from "@/components/design/home-footer";
import { WorkstationHero } from "@/components/workstation/workstation-hero";
import { WorkstationShell } from "@/components/workstation/workstation-shell";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Console",
  description:
    "Direct control console for development environments, container runtimes, and local and cloud workstation telemetry.",
  path: "/workstation",
});

export default function WorkstationPage() {
  return (
    <main className="flex flex-1 flex-col space-y-10 md:space-y-12">
      <section className="relative w-full">
        <div className="container mx-auto w-full overflow-visible">
          <WorkstationHero />
        </div>
      </section>

      <section
        className="relative w-full pb-16 md:pb-24"
        id="workstation-console"
      >
        <div className="container mx-auto w-full overflow-visible">
          <Suspense
            fallback={
              <div className="flex min-h-[400px] items-center justify-center font-mono text-muted-foreground text-xs">
                Loading Ai Workstation Console...
              </div>
            }
          >
            <WorkstationShell />
          </Suspense>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
