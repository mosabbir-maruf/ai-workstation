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
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CopyButton } from "@/components/copy-button";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import {
  homeAreaChartMargin,
  homeBarChartMargin,
  useHomeChartCompact,
} from "@/lib/home-chart-margin";
import { homeTooltipPanelStyle } from "@/lib/home-tooltip-style";
import { cn } from "@/lib/utils";
import {
  type ActiveProjectGitInfo,
  type PreviewResponse,
  type WorkstationTelemetryMetrics,
  workstationApi,
} from "@/lib/workstation/api";
import { SseLogViewer } from "../sse-log-viewer";

const PID_REGEX = /PID:\s*(\d+)/i;
const OPERATOR_NOTES_STORAGE_KEY = "aiws.workstation.operatorNotes";

type ServiceStatusState = "healthy" | "inactive" | "error" | "pending";

interface OverviewSectionProps {
  onSelectTab?: (tabId: string) => void;
}

function StatusDot({ state }: { state: ServiceStatusState }) {
  if (state === "healthy") {
    return (
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
    );
  }
  if (state === "error") {
    return <span className="inline-flex size-2 rounded-full bg-red-500" />;
  }
  if (state === "pending") {
    return (
      <span className="inline-flex size-2 animate-pulse rounded-full bg-amber-500" />
    );
  }
  return (
    <span className="inline-flex size-2 rounded-full bg-muted-foreground/40" />
  );
}

function parseAppStatus(
  res: PromiseSettledResult<{ ok: boolean; output: string }>
): { isRun: boolean; pid: string } {
  if (res.status !== "fulfilled") {
    return { isRun: false, pid: "—" };
  }
  const out = res.value.output;
  const isRun =
    out.toLowerCase().includes("running") ||
    out.toLowerCase().includes("active") ||
    out.includes("PID:");
  const pidMatch = out.match(PID_REGEX);
  return {
    isRun,
    pid: pidMatch?.[1] || (isRun ? "Active" : "—"),
  };
}

function parseHarnessActive(
  res: PromiseSettledResult<{ ok: boolean; output: string }>
): boolean {
  if (res.status !== "fulfilled") {
    return false;
  }
  const out = res.value.output.toLowerCase();
  return (
    out.includes("running") || out.includes("active") || out.includes("ok")
  );
}

function parseTunnelOnline(
  res: PromiseSettledResult<{ ok: boolean; output: string }>
): boolean {
  if (res.status !== "fulfilled") {
    return false;
  }
  const out = res.value.output.toLowerCase();
  return (
    out.includes("active") ||
    out.includes("connected") ||
    out.includes("healthy") ||
    out.includes("running")
  );
}

/**
 * CAD Grid Frame with technical corner ruler ticks
 * matching the landing page grid frames.
 */
function CadGridFrame({
  children,
  className,
  showRulers = true,
}: {
  children: ReactNode;
  className?: string;
  showRulers?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-visible border-border border-t border-l",
        className
      )}
    >
      {children}
      {showRulers && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-px right-0 bottom-0 -left-px -z-10 hidden md:block"
        >
          <div className="absolute -top-4 left-0 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute top-0 -left-4 h-px w-5 bg-muted-foreground/35" />
          <div className="absolute -top-4 right-0 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute top-0 -right-4 h-px w-5 bg-muted-foreground/35" />
          <div className="absolute -bottom-4 left-0 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute bottom-0 -left-4 h-px w-5 bg-muted-foreground/35" />
          <div className="absolute right-0 -bottom-4 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute -right-4 bottom-0 h-px w-5 bg-muted-foreground/35" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Command Strip + 5-Service CAD Matrix
// ---------------------------------------------------------------------------

function CommandAndServicesMatrix({
  workstationState,
  appState,
  appPid,
  appRunning,
  dshState,
  harnessActive,
  brokerState,
  brokerOnline,
  tunnelState,
  tunnelOnline,
  metrics,
  loading,
  actionInProgress,
  actionFeedback,
  onStart,
  onRun,
  onPreview,
  onRestart,
  onRefresh,
}: {
  workstationState: ServiceStatusState;
  appState: ServiceStatusState;
  appPid: string | null;
  appRunning: boolean;
  dshState: ServiceStatusState;
  harnessActive: boolean;
  brokerState: ServiceStatusState;
  brokerOnline: boolean;
  tunnelState: ServiceStatusState;
  tunnelOnline: boolean;
  metrics: WorkstationTelemetryMetrics | null;
  loading: boolean;
  actionInProgress: string | null;
  actionFeedback: string | null;
  onStart: () => void;
  onRun: () => void;
  onPreview: () => void;
  onRestart: () => void;
  onRefresh: () => void;
}) {
  const hostLabel = metrics?.hostname
    ? `${metrics.hostname} (${metrics.cpu.cores}c)`
    : "Unconnected Host";
  const uptimeLabel = metrics?.uptime
    ? `${metrics.uptime} uptime`
    : "Offline";

  const services = [
    {
      index: "S-01",
      title: "Workstation",
      state: workstationState,
      value: workstationState === "healthy" ? "Healthy" : "Offline",
      sub: `${hostLabel} · ${uptimeLabel}`,
      route: "GET /api/health",
      badge: workstationState === "healthy" ? "200 OK" : "DOWN",
    },
    {
      index: "S-02",
      title: "App + PID",
      state: appState,
      value: appRunning ? (appPid && appPid !== "—" ? `PID ${appPid}` : "Active") : "Stopped",
      sub: "Next.js Application Runtime",
      route: "GET /api/app/status",
      badge: appRunning ? "ACTIVE" : "IDLE",
    },
    {
      index: "S-03",
      title: "DSH + Bridge",
      state: dshState,
      value: harnessActive ? "Bridge Ready" : "Stopped",
      sub: "DeepSeek Harness Engine",
      route: "GET /api/harness/status",
      badge: harnessActive ? "SANDBOX" : "IDLE",
    },
    {
      index: "S-04",
      title: "Broker IPC",
      state: brokerState,
      value: brokerOnline ? "IPC Active" : "Offline",
      sub: "Unix Domain Socket IPC",
      route: "INTERNAL BUS",
      badge: brokerOnline ? "SYNC OK" : "DOWN",
    },
    {
      index: "S-05",
      title: "Tunnel Edge",
      state: tunnelState,
      value: tunnelOnline ? "Edge Ingress" : "Disconnected",
      sub: "Cloudflare Named Tunnel",
      route: "GET /api/tunnel",
      badge: tunnelOnline ? "4 COLOS" : "IDLE",
    },
  ];

  return (
    <CadGridFrame showRulers>
      {/* Top Row: CAD Command & Quick Actions Header Bar */}
      <div className="relative border-border border-r border-b bg-white dark:bg-black">
        <div className="flex min-h-11 items-center justify-between gap-3 bg-card/30 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
              [S-00]
            </span>
            <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
              Runtime Control & Service Matrix
            </h4>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
              disabled={loading || actionInProgress !== null}
              onClick={onStart}
              size="xs"
              variant="outline"
            >
              {actionInProgress === "Start Workstation"
                ? "Starting..."
                : "Start"}
            </Button>

            <Button
              className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
              disabled={loading || actionInProgress !== null}
              onClick={onRun}
              size="xs"
              variant="default"
            >
              {actionInProgress === "Run App" ? "Launching..." : "Run App"}
            </Button>

            <Button
              className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
              disabled={loading}
              onClick={onPreview}
              size="xs"
              variant="outline"
            >
              Preview ↗
            </Button>

            <Button
              className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
              disabled={loading || actionInProgress !== null}
              onClick={onRestart}
              size="xs"
              variant="outline"
            >
              {actionInProgress === "App Restart" ? "Restarting..." : "Restart"}
            </Button>

            <Button
              className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
              disabled={loading}
              onClick={onRefresh}
              size="xs"
              variant="ghost"
            >
              {loading ? "Syncing..." : "Sync ↻"}
            </Button>
          </div>
        </div>

        {actionFeedback && (
          <div className="flex items-center justify-between border-border/60 border-t bg-muted/15 px-4 py-1.5 font-mono text-foreground text-xs">
            <span className="truncate">{actionFeedback}</span>
            <span className="ml-2 shrink-0 text-[10px] text-emerald-500 uppercase">
              [ACK]
            </span>
          </div>
        )}
      </div>

      {/* Second Row: 5-Column CAD Service Cells ([S-01] – [S-05]) */}
      <div className="relative w-full overflow-visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((svc) => (
            <div
              className="group flex flex-col justify-between border-border border-r border-b bg-white transition-colors hover:bg-muted/10 dark:bg-black"
              key={svc.index}
            >
              {/* Cell Header Strip */}
              <div className="flex h-9 items-center justify-between gap-2 border-border/60 border-b bg-card/30 px-3.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                    [{svc.index}]
                  </span>
                  <span className="truncate font-bold text-foreground text-xs tracking-tight">
                    {svc.title}
                  </span>
                </div>
                <StatusDot state={svc.state} />
              </div>

              {/* Cell Primary Readout Body */}
              <div className="flex flex-1 flex-col justify-center px-3.5 py-4">
                <div className="font-bold text-foreground text-lg tracking-tight">
                  {svc.value}
                </div>
                <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                  {svc.sub}
                </div>
              </div>

              {/* Cell Footer Strip */}
              <div className="flex h-8 items-center justify-between gap-2 border-border/60 border-t bg-muted/10 px-3.5 font-mono text-[10px] text-muted-foreground/60">
                <span className="truncate">{svc.route}</span>
                <span className="shrink-0 font-medium text-foreground/80">
                  {svc.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
        <GridCornerDots className="z-3 hidden lg:block" columns={5} rows={1} />
      </div>
    </CadGridFrame>
  );
}

// ---------------------------------------------------------------------------
// 2. Live CAD Telemetry Charts
// ---------------------------------------------------------------------------

const defaultWaveData = [
  { date: new Date(2026, 2, 1), cpu: 28, memory: 62 },
  { date: new Date(2026, 2, 3), cpu: 35, memory: 64 },
  { date: new Date(2026, 2, 5), cpu: 44, memory: 67 },
  { date: new Date(2026, 2, 7), cpu: 39, memory: 65 },
  { date: new Date(2026, 2, 9), cpu: 52, memory: 71 },
  { date: new Date(2026, 2, 11), cpu: 47, memory: 69 },
  { date: new Date(2026, 2, 13), cpu: 61, memory: 74 },
  { date: new Date(2026, 2, 15), cpu: 54, memory: 72 },
  { date: new Date(2026, 2, 17), cpu: 42, memory: 68 },
  { date: new Date(2026, 2, 19), cpu: 49, memory: 70 },
];

const defaultPieData = [
  { label: "App Heap", value: 4.2 },
  { label: "DSH Sandbox", value: 3.1 },
  { label: "OS Kernel", value: 2.4 },
  { label: "Page Cache", value: 1.8 },
  { label: "Free RAM", value: 4.5 },
];

const defaultRingData = [
  { label: "Workstation", value: 98, maxValue: 100 },
  { label: "App Runtime", value: 92, maxValue: 100 },
  { label: "DSH Bridge", value: 86, maxValue: 100 },
  { label: "Edge Tunnel", value: 94, maxValue: 100 },
];

const defaultBarData = [
  { month: "T-5m", ingress: 48, egress: 32, buffered: 14 },
  { month: "T-4m", ingress: 62, egress: 44, buffered: 18 },
  { month: "T-3m", ingress: 55, egress: 39, buffered: 15 },
  { month: "T-2m", ingress: 78, egress: 52, buffered: 22 },
  { month: "T-1m", ingress: 69, egress: 47, buffered: 19 },
  { month: "Now", ingress: 74, egress: 56, buffered: 21 },
];

function LiveWaveAreaChart({
  compact,
  metrics,
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
}) {
  const data =
    metrics?.timeline && metrics.timeline.length > 0
      ? metrics.timeline.map((pt, idx) => ({
          date: new Date(2026, 2, idx + 1),
          cpu: pt.cpu,
          memory: pt.memory,
        }))
      : defaultWaveData;

  return (
    <AreaChart
      aspectRatio="5 / 2"
      className={cn("w-full", compact ? "min-h-[110px]" : "min-h-[150px]")}
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
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
}) {
  const data =
    metrics?.memory.pie && metrics.memory.pie.length > 0
      ? metrics.memory.pie
      : defaultPieData;

  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="shrink-0">
        <PieChart
          data={data}
          innerRadius={compact ? 38 : 44}
          size={compact ? 140 : 160}
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
          <PieCenter defaultLabel="Total RAM" suffix=" GB" />
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
              {item.value} GB
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
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
}) {
  const rawRings =
    metrics?.daemons.rings && metrics.daemons.rings.length > 0
      ? metrics.daemons.rings
      : defaultRingData;

  // Normalize each of the 4 rings to a 25-point weight so RingCenter totalValue = composite % out of 100
  const weightPerRing = Math.round(100 / Math.max(1, rawRings.length));
  const normalizedData = rawRings.map((ring) => ({
    label: ring.label,
    value: Math.round((ring.value / (ring.maxValue || 100)) * weightPerRing),
    maxValue: weightPerRing,
  }));

  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="shrink-0">
        <RingChart data={normalizedData} size={compact ? 140 : 165}>
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
}: {
  compact: boolean;
  metrics: WorkstationTelemetryMetrics | null;
}) {
  const data =
    metrics?.throughput && metrics.throughput.length > 0
      ? metrics.throughput
      : defaultBarData;

  return (
    <BarChart
      aspectRatio="5 / 2"
      barGap={0.2}
      className={cn("w-full", compact ? "min-h-[110px]" : "min-h-[150px]")}
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
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  footerMeta: string;
  metricBadge: string;
  span: 5 | 7;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "col-span-full flex min-w-0 flex-col justify-between border-border border-r border-b bg-white dark:bg-black",
        span === 7 ? "md:col-span-7" : "md:col-span-5"
      )}
    >
      {/* CAD Cell Single-Line Technical Header */}
      <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
            [{index}]
          </span>
          <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
            {title}
          </h4>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center border border-border/70 bg-muted/20 px-2 py-0.5 font-mono text-[10px] text-foreground tabular-nums">
          {metricBadge}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="flex min-h-[195px] flex-1 items-center justify-center p-4">
        <div className="flex w-full items-center justify-center">
          {mounted ? (
            children
          ) : (
            <div className="h-[150px] w-full animate-pulse bg-muted/15" />
          )}
        </div>
      </div>

      {/* CAD Cell Footer Strip */}
      <div className="flex h-9 items-center justify-between gap-2 border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
        <span className="truncate">{subtitle}</span>
        <span className="shrink-0">{footerMeta}</span>
      </div>
    </div>
  );
}

export function TelemetryShowcaseGrid({
  metrics,
}: {
  metrics: WorkstationTelemetryMetrics | null;
}) {
  const compact = useHomeChartCompact();

  const cpuBadge = metrics
    ? `${metrics.cpu.usagePercent}% CPU · ${metrics.cpu.cores} Cores`
    : "Offline · No Data";
  const ramBadge = metrics
    ? `${metrics.memory.usedFormatted} / ${metrics.memory.totalFormatted} (${metrics.memory.usedPercent}%)`
    : "Offline · No Data";
  const daemonBadge = metrics
    ? `${metrics.daemons.activeCount}/${metrics.daemons.totalCount} Daemons Online`
    : "Offline · No Data";

  return (
    <CadGridFrame showRulers>
      {/* Row 1: 7-span Wave Area + 5-span Memory Pie */}
      <div className="relative w-full overflow-visible">
        <div className="grid w-full grid-cols-1 overflow-visible md:grid-cols-12">
          <CadTelemetryCell
            footerMeta="node:os · 60s Window"
            index="T-01"
            metricBadge={cpuBadge}
            span={7}
            subtitle="CPU utilization vs Memory pressure"
            title="Compute & Memory Dynamics"
          >
            <LiveWaveAreaChart compact={compact} metrics={metrics} />
          </CadTelemetryCell>

          <CadTelemetryCell
            footerMeta="Physical RAM · 5 Segments"
            index="T-02"
            metricBadge={ramBadge}
            span={5}
            subtitle="Host physical RAM distribution"
            title="Memory Allocation"
          >
            <LiveMemoryPieChart compact={compact} metrics={metrics} />
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
      <div className="relative w-full overflow-visible">
        <div className="grid w-full grid-cols-1 overflow-visible md:grid-cols-12">
          <CadTelemetryCell
            footerMeta="Composite SLA Target ≥ 95%"
            index="T-03"
            metricBadge={daemonBadge}
            span={5}
            subtitle="Subsystem readiness & SLA bounds"
            title="Service Health Quotas"
          >
            <LiveDaemonsRingChart compact={compact} metrics={metrics} />
          </CadTelemetryCell>

          <CadTelemetryCell
            footerMeta="Ingress vs Egress Stream"
            index="T-04"
            metricBadge="RPC & Ingress Ops/s"
            span={7}
            subtitle="Primary ingress vs egress stream"
            title="Container & RPC Throughput"
          >
            <LiveThroughputBarChart compact={compact} metrics={metrics} />
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

// ---------------------------------------------------------------------------
// 3. Workspace Git Tree + Port & Ingress Map CAD Grid
// ---------------------------------------------------------------------------

function WorkspaceAndIngressGrid({
  activeProject,
  previewData,
  onManageProjects,
  onOpenGitSync,
  onOpenTunnel,
}: {
  activeProject: ActiveProjectGitInfo | null;
  previewData: PreviewResponse | null;
  onManageProjects?: () => void;
  onOpenGitSync?: () => void;
  onOpenTunnel?: () => void;
}) {
  const anywhereAppUrl =
    previewData?.anywhereApp || "Not configured (run 'ai tunnel setup')";
  const anywhereDshUrl =
    previewData?.anywhereDsh || "Not configured";
  const worktreePath = activeProject
    ? `/workspace/projects/${activeProject.name}`
    : "No workspace mounted";
  const remoteOriginUrl = activeProject
    ? `https://github.com/mosabbir-maruf/${activeProject.name}.git`
    : "—";

  return (
    <CadGridFrame>
      <div className="relative w-full overflow-visible">
        <div className="grid w-full grid-cols-1 md:grid-cols-12">
          {/* Left 6 cols: [W-01] Active Workspace Repository */}
          <div className="col-span-full flex flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
            <div>
              {/* CAD Header bar (min-h-11 matches [W-02] exactly) */}
              <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                    [W-01]
                  </span>
                  <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
                    Active Workspace Repository
                  </h4>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    onClick={onOpenGitSync}
                    size="xs"
                    variant="ghost"
                  >
                    Git Sync →
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    onClick={onManageProjects}
                    size="xs"
                    variant="outline"
                  >
                    Projects →
                  </Button>
                </div>
              </div>

              {/* Body (p-5 space-y-5 matches [W-02] exactly) */}
              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Repository & Worktree Allocation
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate font-bold font-mono text-foreground text-sm">
                          {activeProject?.name || "None"}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            activeProject ? "bg-emerald-500" : "bg-muted-foreground/40"
                          )}
                        />
                      </div>
                      <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                        Target Repo
                      </span>
                    </div>

                    <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate font-bold font-mono text-foreground text-sm">
                          {activeProject?.branch ? `⎇ ${activeProject.branch}` : "—"}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            activeProject ? "bg-emerald-500" : "bg-muted-foreground/40"
                          )}
                        />
                      </div>
                      <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                        Checked-Out Ref
                      </span>
                    </div>

                    <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate font-bold font-mono text-foreground text-sm tabular-nums">
                          {activeProject
                            ? activeProject.dirtyFilesCount > 0
                              ? `${activeProject.dirtyFilesCount} Mod`
                              : "0 Dirty"
                            : "—"}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            activeProject && activeProject.dirtyFilesCount > 0
                              ? "bg-amber-500"
                              : activeProject
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/40"
                          )}
                        />
                      </div>
                      <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                        Working Tree
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-border/50 border-t pt-4">
                  <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Revision State & Mounted Endpoints
                  </div>
                  {[
                    {
                      label: activeProject?.lastCommitTime
                        ? `Latest Commit (${activeProject.lastCommitTime})`
                        : "Latest Commit",
                      value:
                        activeProject?.lastCommitMessage ||
                        "No commit data available (connect to active project)",
                    },
                    {
                      label: "Mounted Worktree Path",
                      value: worktreePath,
                    },
                    {
                      label: "Remote Origin Upstream",
                      value: remoteOriginUrl,
                    },
                  ].map((item) => (
                    <div
                      className="flex items-center justify-between gap-3 border border-border/70 bg-muted/15 px-3.5 py-2"
                      key={item.label}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                          {item.label}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-foreground text-xs">
                          {item.value}
                        </div>
                      </div>
                      <CopyButton
                        aria-label={`Copy ${item.label}`}
                        className="h-7 w-7 shrink-0 rounded-none border border-border/60"
                        text={item.value}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CAD Footer bar (h-9 matches [W-02] exactly) */}
            <div className="flex h-9 items-center justify-between border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
              <span>VCS · Git Worktree Mount Status</span>
              <span>HEAD → {activeProject?.branch || "None"}</span>
            </div>
          </div>

          {/* Right 6 cols: [W-02] Port & Edge Ingress Map */}
          <div className="col-span-full flex flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
            <div>
              {/* CAD Header bar (min-h-11 matches [W-01] exactly) */}
              <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                    [W-02]
                  </span>
                  <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
                    Port & Edge Ingress Map
                  </h4>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    onClick={onOpenTunnel}
                    size="xs"
                    variant="outline"
                  >
                    Edge Tunnel →
                  </Button>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Host-Bound Port Allocations
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                    {[
                      { port: "3000", service: "App (Next.js)" },
                      { port: "8080", service: "DSH RPC" },
                      { port: "4040", service: "Tunnel" },
                      { port: "9000", service: "Broker IPC" },
                      { port: "22", service: "SSH" },
                    ].map((item) => (
                      <div
                        className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/30"
                        key={item.port}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold font-mono text-foreground text-sm tabular-nums">
                            :{item.port}
                          </span>
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                          {item.service}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-border/50 border-t pt-4">
                  <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Routed Ingress Endpoints
                  </div>
                  {[
                    {
                      label: "Current Origin",
                      url:
                        typeof window !== "undefined"
                          ? window.location.origin
                          : "Same-origin endpoint",
                    },
                    { label: "Anywhere App Edge", url: anywhereAppUrl },
                    { label: "Anywhere DSH Harness", url: anywhereDshUrl },
                  ].map((endpoint) => (
                    <div
                      className="flex items-center justify-between gap-3 border border-border/70 bg-muted/15 px-3.5 py-2"
                      key={endpoint.label}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                          {endpoint.label}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-foreground text-xs">
                          {endpoint.url}
                        </div>
                      </div>
                      <CopyButton
                        aria-label={`Copy ${endpoint.label}`}
                        className="h-7 w-7 shrink-0 rounded-none border border-border/60"
                        text={endpoint.url}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CAD Footer bar (h-9 matches [W-01] exactly) */}
            <div className="flex h-9 items-center justify-between border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
              <span>Ingress · Cloudflare Zero Trust</span>
              <span>TLS 1.3 Active</span>
            </div>
          </div>
        </div>

        <GridCornerDots
          className="z-3 hidden md:block"
          columns={2}
          columnWeights={[6, 6]}
          rows={1}
        />
      </div>
    </CadGridFrame>
  );
}

// ---------------------------------------------------------------------------
// 4. Live Log Stream + Operator Notes CAD Grid
// ---------------------------------------------------------------------------

const QUICK_NOTE_TEMPLATES = [
  {
    label: "+ Pre-Deploy Snapshot",
    snippet: "[ ] Export workstation state snapshot before runtime upgrade",
  },
  {
    label: "+ Tunnel Check",
    snippet: "[ ] Verify Cloudflare Zero Trust ingress CNAME & TLS 1.3 status",
  },
  {
    label: "+ DSH Key Audit",
    snippet: "[ ] Rotate DSH provider keys and verify broker heartbeat",
  },
] as const;

function LogsAndNotesGrid({ onOpenFullLogs }: { onOpenFullLogs?: () => void }) {
  const [notes, setNotes] = useState<string>("");
  const [notesSavedAt, setNotesSavedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = window.localStorage.getItem(OPERATOR_NOTES_STORAGE_KEY);
        if (saved !== null) {
          setNotes(saved);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const persistNotes = useCallback((val: string) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(OPERATOR_NOTES_STORAGE_KEY, val);
        const now = new Date();
        setNotesSavedAt(`Saved ${now.toLocaleTimeString()}`);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      persistNotes(val);
    }, 300);
  };

  const handleClearNotes = () => {
    setNotes("");
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(OPERATOR_NOTES_STORAGE_KEY);
        setNotesSavedAt("Cleared");
      }
    } catch {
      // ignore
    }
  };

  const handleAppendSnippet = (snippet: string) => {
    const next =
      notes.trim().length > 0 ? `${notes.trimEnd()}\n${snippet}` : snippet;
    handleNotesChange(next);
  };

  return (
    <CadGridFrame>
      <div className="relative w-full overflow-visible">
        <div className="grid w-full grid-cols-1 md:grid-cols-12">
          {/* Left 6 cols: Mini Log Tail */}
          <div className="col-span-full flex flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
            <SseLogViewer
              action={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  onClick={onOpenFullLogs}
                  size="xs"
                  variant="outline"
                >
                  Full Logs →
                </Button>
              }
              className="h-full border-0 shadow-none"
              compact
              endpoint="/api/logs/app"
              maxLines={15}
              title="[L-01] Live App Log Tail"
            />
          </div>

          {/* Right 6 cols: Operator Notes Scratchpad */}
          <div className="col-span-full flex flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
            {/* CAD Header bar (min-h-11 matches [L-01] exactly) */}
            <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                  [L-02]
                </span>
                <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
                  Operator Notes
                </h4>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={notes.length === 0}
                  onClick={handleClearNotes}
                  size="xs"
                  variant="ghost"
                >
                  Clear
                </Button>
                <CopyButton
                  aria-label="Copy operator notes"
                  className="h-6 w-6 rounded-none border border-border/60"
                  text={notes}
                />
              </div>
            </div>

            {/* Scratchpad Body */}
            <div className="flex flex-1 flex-col justify-between gap-2.5 p-4">
              {/* Quick-insert runbook templates */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Quick Insert:
                </span>
                {QUICK_NOTE_TEMPLATES.map((item) => (
                  <button
                    className="border border-border/70 bg-muted/15 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 hover:text-foreground"
                    key={item.label}
                    onClick={() => handleAppendSnippet(item.snippet)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                className="min-h-[144px] w-full flex-1 resize-none rounded-none border border-border/70 bg-muted/15 p-3 font-mono text-foreground text-xs leading-relaxed placeholder:text-muted-foreground/40 focus:border-foreground/50 focus:outline-none"
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={
                  "// Operational scratchpad (persisted in browser localStorage).\n// Click a Quick Insert tag above or type runbook notes..."
                }
                spellCheck={false}
                value={notes}
              />
            </div>

            {/* CAD Footer bar (h-9 matches [L-01] exactly) */}
            <div className="flex h-9 items-center justify-between border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
              <span>Storage · localStorage (Browser Local)</span>
              <span>
                {notes.length} chars · {notesSavedAt || "Synced"}
              </span>
            </div>
          </div>
        </div>

        <GridCornerDots
          className="z-3 hidden md:block"
          columns={2}
          columnWeights={[6, 6]}
          rows={1}
        />
      </div>
    </CadGridFrame>
  );
}

// ---------------------------------------------------------------------------
// Main OverviewSection Export
// ---------------------------------------------------------------------------

export function OverviewSection({ onSelectTab }: OverviewSectionProps) {
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [telemetryMetrics, setTelemetryMetrics] =
    useState<WorkstationTelemetryMetrics | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [appPid, setAppPid] = useState<string | null>(null);
  const [appRunning, setAppRunning] = useState<boolean>(false);
  const [harnessActive, setHarnessActive] = useState<boolean>(false);
  const [brokerOnline, setBrokerOnline] = useState<boolean>(false);
  const [tunnelOnline, setTunnelOnline] = useState<boolean>(false);

  const [activeProject, setActiveProject] =
    useState<ActiveProjectGitInfo | null>(null);

  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);

  const refreshAllTelemetry = useCallback(async () => {
    try {
      setLoading(true);
      const [hRes, sRes, aRes, harRes, tRes, pRes, prevRes] =
        await Promise.allSettled([
          workstationApi.getHealth(),
          workstationApi.getStatus(),
          workstationApi.getAppStatus(),
          workstationApi.getHarnessStatus(),
          workstationApi.getTunnelStatus(),
          workstationApi.getProjects(),
          workstationApi.getPreview(),
        ]);

      const isHealthy =
        (hRes.status === "fulfilled" && hRes.value.ok) ||
        (sRes.status === "fulfilled" && Boolean(sRes.value.metrics));
      setHealthOk(isHealthy);
      setBrokerOnline(isHealthy);

      if (sRes.status === "fulfilled" && sRes.value.metrics) {
        setTelemetryMetrics(sRes.value.metrics);
      }

      const appParsed = parseAppStatus(aRes);
      setAppRunning(appParsed.isRun);
      setAppPid(appParsed.pid);

      setHarnessActive(parseHarnessActive(harRes));
      setTunnelOnline(parseTunnelOnline(tRes));

      if (pRes.status === "fulfilled" && pRes.value.activeProject) {
        setActiveProject(pRes.value.activeProject);
      }

      if (prevRes.status === "fulfilled") {
        setPreviewData(prevRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllTelemetry();
  }, [refreshAllTelemetry]);

  const executeQuickAction = async (
    name: string,
    actionFn: () => Promise<{ ok: boolean; output: string }>
  ) => {
    try {
      setActionInProgress(name);
      setActionFeedback(null);
      const res = await actionFn();
      setActionFeedback(
        `[${name.toUpperCase()} SUCCESS]: ${res.output.split("\n")[0]}`
      );
      await refreshAllTelemetry();
    } catch (err) {
      setActionFeedback(`[${name.toUpperCase()} FAILED]: ${String(err)}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLaunchPreview = () => {
    const targetUrl =
      previewData?.anywhereApp ||
      (typeof window !== "undefined" ? window.location.origin : "/");
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  let workstationState: ServiceStatusState = "pending";
  if (healthOk === true) {
    workstationState = "healthy";
  } else if (healthOk === false) {
    workstationState = "error";
  }

  const appState: ServiceStatusState = appRunning ? "healthy" : "inactive";
  const dshState: ServiceStatusState = harnessActive ? "healthy" : "inactive";
  const brokerState: ServiceStatusState = brokerOnline ? "healthy" : "inactive";
  const tunnelState: ServiceStatusState = tunnelOnline ? "healthy" : "inactive";

  return (
    <div className="space-y-10 md:space-y-11">
      {/* 1. UNIFIED COMMAND STRIP & 5-SERVICE CAD MATRIX */}
      <CommandAndServicesMatrix
        actionFeedback={actionFeedback}
        actionInProgress={actionInProgress}
        appPid={appPid}
        appRunning={appRunning}
        appState={appState}
        brokerOnline={brokerOnline}
        brokerState={brokerState}
        dshState={dshState}
        harnessActive={harnessActive}
        loading={loading}
        metrics={telemetryMetrics}
        onPreview={handleLaunchPreview}
        onRefresh={refreshAllTelemetry}
        onRestart={() =>
          executeQuickAction("App Restart", workstationApi.appRestart)
        }
        onRun={() => executeQuickAction("Run App", workstationApi.appRun)}
        onStart={() =>
          executeQuickAction(
            "Start Workstation",
            workstationApi.startWorkstation
          )
        }
        tunnelOnline={tunnelOnline}
        tunnelState={tunnelState}
        workstationState={workstationState}
      />

      {/* 2. LIVE CAD TELEMETRY MATRIX */}
      <TelemetryShowcaseGrid metrics={telemetryMetrics} />

      {/* 3. WORKSPACE GIT TREE + PORT & EDGE INGRESS MAP */}
      <WorkspaceAndIngressGrid
        activeProject={activeProject}
        onManageProjects={() => onSelectTab?.("projects")}
        onOpenGitSync={() => onSelectTab?.("git")}
        onOpenTunnel={() => onSelectTab?.("tunnel")}
        previewData={previewData}
      />

      {/* 4. LIVE LOG STREAM + OPERATOR SCRATCHPAD */}
      <LogsAndNotesGrid onOpenFullLogs={() => onSelectTab?.("app")} />
    </div>
  );
}
