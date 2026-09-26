"use client";

import { GridPageHero } from "@/components/design/grid-page-hero";
import { Button } from "@/components/ui/button";

export function WorkstationHero() {
  return (
    <GridPageHero
      action={
        <Button
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
