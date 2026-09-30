"use client";

import {
  Area,
  AreaChart,
  Background,
  Bar,
  BarChart,
  BarXAxis,
  ChartTooltip,
  Grid,
  PatternLines,
  PieCenter,
  PieChart,
  PieSlice,
  Ring,
  RingCenter,
  RingChart,
} from "@aiws/ui/charts";
import { curveNatural } from "@visx/curve";
import { type ReactNode, useEffect, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import {
  homeAreaChartMargin,
  homeBarChartMargin,
  useHomeChartCompact,
} from "@/lib/home-chart-margin";
import { homeTooltipPanelStyle } from "@/lib/home-tooltip-style";
import { cn } from "@/lib/utils";
import type { WorkstationTelemetryMetrics } from "@/lib/workstation/api";
import { CadGridFrame } from "./cad-primitives";

export { CadGridFrame };

function ChartEmptyState({
  title = "Telemetry Offline",
  description = "Awaiting connection to workstation daemon...",
  height = "min-h-[140px]",
  isLoading = false,
}: {
  title?: string;
  description?: string;
  height?: string;
  isLoading?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center border border-dashed border-border/70 bg-muted/5 p-4 text-center",
        height
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider",
          isLoading ? "text-amber-500" : "text-muted-foreground"
        )}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="size-3 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500"
          />
        ) : (
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        )}
        {isLoading ? "Synchronizing Telemetry..." : title}
      </div>
      <p className="mt-1 max-w-[280px] font-mono text-[10px] text-muted-foreground/70">
        {isLoading
          ? "Reading real-time compute & memory timeseries from host..."
          : description}
      </p>
    </div>
  );
}

function LiveWaveAreaChart({
  compact,
  metrics,
  loading = false,
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
  loading?: boolean;
}) {
  if (!metrics?.timeline || metrics.timeline.length === 0) {
    return (
      <ChartEmptyState
        description="Connect backend to stream compute & memory timeseries."
        height={compact ? "min-h-[110px]" : "min-h-[150px]"}
        isLoading={loading}
        title="Compute Stream Inactive"
      />
    );
  }

  let rawTimeline = metrics.timeline;
  if (rawTimeline.length === 1) {
    const single = rawTimeline[0];
    const prevDate = new Date(Date.now() - 5000).toISOString();
    rawTimeline = [
      { date: prevDate, cpu: single.cpu, memory: single.memory },
      single,
    ];
  }

  const data = rawTimeline.map((pt, idx) => ({
    date: new Date(2026, 2, idx + 1),
    cpu: pt.cpu,
    memory: pt.memory,
  }));

  return (
    <AreaChart
      aspectRatio={compact ? "2 / 1" : "5 / 2"}
      className={cn("w-full min-w-0", compact ? "h-[140px]" : "min-h-[150px]")}
      data={data}
      margin={homeAreaChartMargin(compact)}
    >
      <Background />
      <Grid horizontal />
      <Area
        curve={curveNatural}
        dataKey="cpu"
        fill="var(--chart-1)"
        fillOpacity={0.25}
        stroke="var(--chart-1)"
      />
      <Area
        curve={curveNatural}
        dataKey="memory"
        fill="var(--chart-2)"
        fillOpacity={0.2}
        stroke="var(--chart-2)"
      />
      <ChartTooltip
        panelStyle={homeTooltipPanelStyle}
        rows={(point) => [
          {
            color: "var(--chart-1)",
            label: "CPU Load",
            value: `${point.cpu ?? 0}%`,
          },
          {
            color: "var(--chart-2)",
            label: "Memory Pressure",
            value: `${point.memory ?? 0}%`,
          },
        ]}
      />
    </AreaChart>
  );
}

const PIE_SWATCH_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function LiveMemoryPieChart({
  compact,
  metrics,
  loading = false,
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
  loading?: boolean;
}) {
  if (!metrics?.memory?.pie || metrics.memory.pie.length === 0) {
    return (
      <ChartEmptyState
        description="Physical RAM segmentation available once host connects."
        height={compact ? "min-h-[140px]" : "min-h-[160px]"}
        isLoading={loading}
        title="Memory Metrics Inactive"
      />
    );
  }

  const data = metrics.memory.pie;

  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
      <div className="flex shrink-0 items-center justify-center">
        <PieChart
          data={data}
          innerRadius={compact ? 34 : 44}
          size={compact ? 130 : 160}
        >
          <PatternLines
            height={6}
            id="overview-pie-pattern-1"
            orientation={["diagonal"]}
            stroke="var(--chart-1)"
            strokeWidth={1}
            width={6}
          />
          <PatternLines
            height={6}
            id="overview-pie-pattern-3"
            orientation={["diagonal"]}
            stroke="var(--chart-3)"
            strokeWidth={1}
            width={6}
          />
          {data.map((item, index) => {
            let fillValue: string | undefined;
            if (index === 0) {
              fillValue = "url(#overview-pie-pattern-1)";
            } else if (index === 2) {
              fillValue = "url(#overview-pie-pattern-3)";
            }
            return (
              <PieSlice
                fill={fillValue}
                hoverEffect="translate"
                index={index}
                key={item.label}
              />
            );
          })}
          <PieCenter
            defaultLabel="Total RAM"
            formatOptions={{
              minimumFractionDigits: 1,
              maximumFractionDigits: 2,
            }}
            suffix=" GB"
          />
        </PieChart>
      </div>

      <div className="w-full min-w-0 flex-1 space-y-1.5 border-border/50 sm:border-l sm:pl-4">
        {data.map((item, idx) => (
          <div
            className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-2.5 py-1 font-mono text-[11px]"
            key={item.label}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0"
                style={{
                  backgroundColor:
                    PIE_SWATCH_COLORS[idx % PIE_SWATCH_COLORS.length],
                }}
              />
              <span className="truncate text-muted-foreground">
                {item.label}
              </span>
            </div>
            <span className="shrink-0 font-bold text-foreground tabular-nums">
              {typeof item.value === "number"
                ? item.value < 1 && item.value > 0
                  ? `${Math.round(item.value * 1024)} MB`
                  : `${item.value.toFixed(2)} GB`
                : `${item.value} GB`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDaemonsRingChart({
  compact,
  metrics,
  loading = false,
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
  loading?: boolean;
}) {
  if (!metrics?.daemons?.rings || metrics.daemons.rings.length === 0) {
    return (
      <ChartEmptyState
        description="Subsystem health quotas stream when daemon is active."
        height={compact ? "min-h-[140px]" : "min-h-[165px]"}
        isLoading={loading}
        title="Daemon Telemetry Offline"
      />
    );
  }

  const rawRings = metrics.daemons.rings;
  const weightPerRing = Math.round(100 / Math.max(1, rawRings.length));
  const normalizedData = rawRings.map((ring) => ({
    label: ring.label,
    value: Math.round((ring.value / (ring.maxValue || 100)) * weightPerRing),
    maxValue: weightPerRing,
  }));

  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
      <div className="flex shrink-0 items-center justify-center">
        <RingChart data={normalizedData} size={compact ? 130 : 165}>
          {normalizedData.map((item, index) => (
            <Ring index={index} key={item.label} />
          ))}
          <RingCenter defaultLabel="SLA Score" suffix="%" />
        </RingChart>
      </div>

      <div className="w-full min-w-0 flex-1 space-y-1.5 border-border/50 sm:border-l sm:pl-4">
        {rawRings.map((item, idx) => (
          <div
            className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-2.5 py-1.5 font-mono text-[11px]"
            key={item.label}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0"
                style={{
                  backgroundColor:
                    PIE_SWATCH_COLORS[idx % PIE_SWATCH_COLORS.length],
                }}
              />
              <span className="truncate text-muted-foreground">
                {item.label}
              </span>
            </div>
            <span className="shrink-0 font-bold text-foreground tabular-nums">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveThroughputBarChart({
  compact,
  metrics,
  loading = false,
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
  loading?: boolean;
}) {
  if (!metrics?.throughput || metrics.throughput.length === 0) {
    return (
      <ChartEmptyState
        description="Ingress and egress throughput record upon container activity."
        height={compact ? "min-h-[110px]" : "min-h-[150px]"}
        isLoading={loading}
        title="Throughput Monitor Idle"
      />
    );
  }

  const data = metrics.throughput;

  return (
    <BarChart
      aspectRatio={compact ? "2 / 1" : "5 / 2"}
      barGap={0.2}
      className={cn("w-full min-w-0", compact ? "h-[140px]" : "min-h-[150px]")}
      data={data}
      margin={homeBarChartMargin(compact)}
      xDataKey="month"
    >
      <Grid horizontal />
      <PatternLines
        height={8}
        id="overview-bar-pattern"
        orientation={["diagonal"]}
        stroke="var(--chart-1)"
        strokeWidth={2}
        width={8}
      />
      <Bar
        dataKey="ingress"
        fill="url(#overview-bar-pattern)"
        lineCap="butt"
        stroke="var(--chart-1)"
      />
      <Bar
        dataKey="egress"
        fill="var(--chart-2)"
        lineCap="butt"
        stroke="var(--chart-2)"
      />
      <BarXAxis />
      <ChartTooltip panelStyle={homeTooltipPanelStyle} />
    </BarChart>
  );
}

function CadTelemetryCell({
  index,
  title,
  subtitle,
  footerMeta,
  metricBadge,
  span,
  mounted,
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  footerMeta: string;
  metricBadge: string;
  span: 5 | 7;
  mounted: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "col-span-full flex w-full min-w-0 max-w-full flex-col justify-between border-border border-r border-b bg-white dark:bg-black",
        span === 7 ? "md:col-span-7" : "md:col-span-5"
      )}
    >
      {/* CAD Cell Single-Line Technical Header */}
      <div className="flex min-h-11 w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-border/60 border-b bg-card/30 px-3.5 py-2 sm:flex-nowrap sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
            [{index}]
          </span>
          <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
            {title}
          </h4>
        </div>
        <span className="inline-flex max-w-full shrink-0 items-center truncate border border-border/70 bg-muted/20 px-2 py-0.5 font-mono text-[10px] text-foreground tabular-nums sm:ml-auto">
          {metricBadge}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="flex min-h-[170px] w-full min-w-0 flex-1 items-center justify-center overflow-hidden p-3 sm:min-h-[195px] sm:p-4">
        <div className="flex w-full min-w-0 items-center justify-center">
          {mounted ? (
            children
          ) : (
            <div className="h-[140px] w-full animate-pulse bg-muted/15 sm:h-[150px]" />
          )}
        </div>
      </div>

      {/* CAD Cell Footer Strip */}
      <div className="flex h-9 w-full min-w-0 items-center justify-between gap-2 border-border/60 border-t bg-muted/10 px-3.5 font-mono text-[10px] text-muted-foreground/60 sm:px-4">
        <span className="truncate">{subtitle}</span>
        <span className="shrink-0">{footerMeta}</span>
      </div>
    </div>
  );
}

export function TelemetryShowcaseGrid({
  metrics,
  loading = false,
}: {
  metrics: WorkstationTelemetryMetrics | null;
  loading?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const compact = useHomeChartCompact();
  const isInitialSync = loading && metrics === null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const cpuBadge = metrics
    ? `${metrics.cpu.usagePercent}% CPU · ${metrics.cpu.cores} Cores`
    : isInitialSync
      ? "Syncing Telemetry..."
      : "Offline · No Data";
  const ramBadge = metrics
    ? `${metrics.memory.usedFormatted} / ${metrics.memory.totalFormatted} (${metrics.memory.usedPercent}%)`
    : isInitialSync
      ? "Reading RAM..."
      : "Offline · No Data";
  const daemonBadge = metrics
    ? `${metrics.daemons.activeCount}/${metrics.daemons.totalCount} Daemons Online`
    : isInitialSync
      ? "Probing Subsystems..."
      : "Offline · No Data";

  return (
    <CadGridFrame showRulers>
      {/* Row 1: 7-span Wave Area + 5-span Memory Pie */}
      <div className="relative w-full min-w-0 max-w-full overflow-visible">
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 overflow-visible md:grid-cols-12">
          <CadTelemetryCell
            footerMeta="node:os · 60s Window"
            index="T-01"
            metricBadge={cpuBadge}
            mounted={mounted}
            span={7}
            subtitle="CPU utilization vs Memory pressure"
            title="Compute & Memory Dynamics"
          >
            <LiveWaveAreaChart
              compact={compact}
              loading={loading}
              metrics={metrics}
            />
          </CadTelemetryCell>

          <CadTelemetryCell
            footerMeta="Physical RAM · 5 Segments"
            index="T-02"
            metricBadge={ramBadge}
            mounted={mounted}
            span={5}
            subtitle="Host physical RAM distribution"
            title="Memory Allocation"
          >
            <LiveMemoryPieChart
              compact={compact}
              loading={loading}
              metrics={metrics}
            />
          </CadTelemetryCell>
        </div>
        <GridCornerDots
          className="z-3 hidden md:block"
          columns={2}
          columnWeights={[7, 5]}
          rows={1}
        />
      </div>

      {/* Row 2: 5-span Daemon Ring + 7-span Throughput Bar */}
      <div className="relative w-full min-w-0 max-w-full overflow-visible">
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 overflow-visible md:grid-cols-12">
          <CadTelemetryCell
            footerMeta="Composite SLA Target ≥ 95%"
            index="T-03"
            metricBadge={daemonBadge}
            mounted={mounted}
            span={5}
            subtitle="Subsystem readiness & SLA bounds"
            title="Service Health Quotas"
          >
            <LiveDaemonsRingChart
              compact={compact}
              loading={loading}
              metrics={metrics}
            />
          </CadTelemetryCell>

          <CadTelemetryCell
            footerMeta="Ingress vs Egress Stream"
            index="T-04"
            metricBadge={
              isInitialSync ? "Syncing Ingress..." : "RPC & Ingress Ops/s"
            }
            mounted={mounted}
            span={7}
            subtitle="Primary ingress vs egress stream"
            title="Container & RPC Throughput"
          >
            <LiveThroughputBarChart
              compact={compact}
              loading={loading}
              metrics={metrics}
            />
          </CadTelemetryCell>
        </div>
        <GridCornerDots
          className="z-3 hidden md:block"
          columns={2}
          columnWeights={[5, 7]}
          rows={1}
        />
      </div>
    </CadGridFrame>
  );
}
