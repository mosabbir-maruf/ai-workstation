"use client";

import { DesignSectionHeader } from "@/components/design/section-header";
import { TelemetryShowcaseGrid } from "@/components/workstation/sections/overview-section";

export function HomeTelemetrySection() {
  return (
    <section
      aria-labelledby="telemetry-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible">
        <DesignSectionHeader
          subtitle="Real-time CPU dynamics, physical RAM distribution, daemon SLAs & container throughput"
          title="Runtime telemetry"
          titleId="telemetry-heading"
        />

        <div className="relative w-full">
          <TelemetryShowcaseGrid metrics={null} />
        </div>
      </div>
    </section>
  );
}
