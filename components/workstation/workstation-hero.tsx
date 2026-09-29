"use client";

import { GridPageHero } from "@/components/design/grid-page-hero";
import { Button } from "@/components/ui/button";

export function WorkstationHero() {
  return (
    <GridPageHero
      action={
        <Button
          className="h-9 px-4 text-xs sm:h-11 sm:px-8 sm:text-sm"
          onClick={() => {
            document
              .getElementById("workstation-console")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          size="lg"
          variant="white"
        >
          Launch Console
        </Button>
      }
      subtitle="Development environment & AI workstation control dashboard"
      title="Console"
    />
  );
}
