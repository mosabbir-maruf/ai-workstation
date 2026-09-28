"use client";

import { DesignSectionHeader } from "@/components/design/section-header";
import { TelemetryShowcaseGrid } from "@/components/workstation/sections/overview-section";
import type { WorkstationTelemetryMetrics } from "@/lib/workstation/api";

const LANDING_MOCK_TELEMETRY_METRICS: WorkstationTelemetryMetrics = {
  cpu: {
    cores: 8,
    model: "AMD EPYC 7763 64-Core Processor",
    loadAvg: [0.42, 0.38, 0.31],
    usagePercent: 24,
  },
  memory: {
    totalBytes: 17_179_869_184,
    usedBytes: 6_657_199_308,
    freeBytes: 10_522_669_876,
    usedPercent: 38.8,
    totalFormatted: "16.0 GB",
    usedFormatted: "6.2 GB",
    pie: [
      { label: "DSH Harness", value: 1.85 },
      { label: "App Runtime", value: 2.15 },
      { label: "Docker Engine", value: 1.35 },
      { label: "Kernel & Page", value: 0.85 },
      { label: "Free Headroom", value: 9.8 },
    ],
  },
  daemons: {
    totalCount: 4,
    activeCount: 4,
    rings: [
      { label: "Workstation Container", value: 100, maxValue: 100 },
      { label: "DSH Agent Harness", value: 99, maxValue: 100 },
      { label: "GitHub App Broker", value: 100, maxValue: 100 },
      { label: "Cloudflare Zero-Trust", value: 98, maxValue: 100 },
    ],
  },
  throughput: [
    { month: "00s", ingress: 142, egress: 98, buffered: 12 },
    { month: "10s", ingress: 186, egress: 134, buffered: 15 },
    { month: "20s", ingress: 238, egress: 168, buffered: 18 },
    { month: "30s", ingress: 204, egress: 152, buffered: 14 },
    { month: "40s", ingress: 276, egress: 194, buffered: 21 },
    { month: "50s", ingress: 248, egress: 178, buffered: 16 },
  ],
  timeline: [
    { date: "2026-03-01T00:00:00Z", cpu: 18, memory: 36 },
    { date: "2026-03-01T00:00:10Z", cpu: 22, memory: 37 },
    { date: "2026-03-01T00:00:20Z", cpu: 31, memory: 39 },
    { date: "2026-03-01T00:00:30Z", cpu: 27, memory: 38 },
    { date: "2026-03-01T00:00:40Z", cpu: 19, memory: 38 },
    { date: "2026-03-01T00:00:50Z", cpu: 29, memory: 40 },
    { date: "2026-03-01T00:01:00Z", cpu: 24, memory: 39 },
  ],
  uptime: "14d 08h 42m",
  hostname: "aiws-node-01",
  platform: "Linux 6.8.0-x86_64",
};

export function HomeTelemetrySection() {
  return (
    <section
      aria-labelledby="telemetry-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible px-4">
        <DesignSectionHeader
          subtitle="Real-time CPU dynamics, physical RAM distribution, daemon SLAs & container throughput"
          title="Runtime telemetry"
          titleId="telemetry-heading"
        />

        <div className="relative w-full">
          <TelemetryShowcaseGrid metrics={LANDING_MOCK_TELEMETRY_METRICS} />
        </div>
      </div>
    </section>
  );
}
