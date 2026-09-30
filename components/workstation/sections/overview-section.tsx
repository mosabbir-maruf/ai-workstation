"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CopyButton } from "@/components/copy-button";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type ActiveProjectGitInfo,
  type PreviewResponse,
  type WorkstationTelemetryMetrics,
  workstationApi,
} from "@/lib/workstation/api";
import { CadGridFrame } from "../cad-primitives";
import { SseLogViewer } from "../sse-log-viewer";
import { TelemetryShowcaseGrid } from "../telemetry-showcase-grid";

export { TelemetryShowcaseGrid };

const OPERATOR_NOTES_STORAGE_KEY = "aiws.workstation.operatorNotes";

type ServiceStatusState = "healthy" | "inactive" | "error" | "pending";

interface CachedOverviewData {
  healthOk: boolean | null;
  workstationRunning: boolean;
  appRunning: boolean;
  appPid: string | null;
  harnessActive: boolean;
  brokerOnline: boolean;
  tunnelOnline: boolean;
  activeProject: ActiveProjectGitInfo | null;
  previewData: PreviewResponse | null;
  telemetryMetrics: WorkstationTelemetryMetrics | null;
}

let lastOverviewCache: CachedOverviewData | null = null;

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

export interface ActionFeedbackInfo {
  ok: boolean;
  command: string;
  actionName: string;
  title: string;
  headline?: string;
  fullOutput: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 1. Command Strip + 5-Service CAD Matrix
// ---------------------------------------------------------------------------

function CommandAndServicesMatrix({
  workstationState,
  workstationRunning,
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
  onDismissFeedback,
  onStart,
  onStop,
  onRun,
  onStopApp,
  onPreview,
  onRestart,
  onRefresh,
}: {
  workstationState: ServiceStatusState;
  workstationRunning: boolean;
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
  actionFeedback: ActionFeedbackInfo | null;
  onDismissFeedback?: () => void;
  onStart: () => void;
  onStop: () => void;
  onRun: () => void;
  onStopApp: () => void;
  onPreview: () => void;
  onRestart: () => void;
  onRefresh: () => void;
}) {

  const isInitialSync = loading && metrics === null;

  const hostLabel = metrics?.hostname
    ? `${metrics.hostname} (${metrics.cpu.cores}c)`
    : isInitialSync
    ? "Connecting Host..."
    : "Unconnected Host";
  const uptimeLabel = metrics?.uptime
    ? `${metrics.uptime} uptime`
    : isInitialSync
    ? "Syncing"
    : "Offline";

  const services = [
    {
      index: "S-01",
      title: "Workstation",
      state: isInitialSync ? "pending" : workstationState,
      value: isInitialSync ? "Syncing..." : workstationRunning ? "Running" : "Stopped",
      sub: `${hostLabel} · ${uptimeLabel}`,
      route: "GET /api/status",
      badge: isInitialSync ? "SYNC" : workstationRunning ? "ACTIVE" : "IDLE",
    },
    {
      index: "S-02",
      title: "App + PID",
      state: isInitialSync ? "pending" : appState,
      value: isInitialSync
        ? "Syncing..."
        : appRunning && appPid
          ? `PID ${appPid}`
          : "Stopped",
      sub: isInitialSync ? "Probing runtime..." : "Next.js Application Runtime",
      route: "GET /api/app/status",
      badge: isInitialSync ? "SYNC" : appRunning ? "ACTIVE" : "IDLE",
    },
    {
      index: "S-03",
      title: "DSH + Bridge",
      state: isInitialSync ? "pending" : dshState,
      value: isInitialSync ? "Syncing..." : harnessActive ? "Bridge Ready" : "Stopped",
      sub: isInitialSync ? "Probing harness..." : "DeepSeek Harness Engine",
      route: "GET /api/harness/status",
      badge: isInitialSync ? "SYNC" : harnessActive ? "SANDBOX" : "IDLE",
    },
    {
      index: "S-04",
      title: "Broker IPC",
      state: isInitialSync ? "pending" : brokerState,
      value: isInitialSync ? "Syncing..." : brokerOnline ? "IPC Active" : "Offline",
      sub: isInitialSync ? "Probing socket..." : "Unix Domain Socket IPC",
      route: "INTERNAL BUS",
      badge: isInitialSync ? "SYNC" : brokerOnline ? "SYNC OK" : "DOWN",
    },
    {
      index: "S-05",
      title: "Tunnel Edge",
      state: isInitialSync ? "pending" : tunnelState,
      value: isInitialSync ? "Syncing..." : tunnelOnline ? "Edge Ingress" : "Disconnected",
      sub: isInitialSync ? "Probing ingress..." : "Cloudflare Named Tunnel",
      route: "GET /api/tunnel",
      badge: isInitialSync ? "SYNC" : tunnelOnline ? "4 COLOS" : "IDLE",
    },
  ];

  return (
    <CadGridFrame showRulers>
      {/* Top Row: CAD Command & Quick Actions Header Bar */}
      <div className="relative border-border border-r border-b bg-white dark:bg-black">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-card/30 px-3.5 py-2 sm:flex-nowrap sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
              [S-00]
            </span>
            <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
              Runtime Control & Service Matrix
            </h4>
          </div>

          <div className="flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-auto sm:overflow-visible no-scrollbar sm:ml-auto sm:w-auto sm:shrink-0 sm:gap-1.5">
            {workstationRunning ? (
              <Button
                className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/30 sm:px-2.5 sm:tracking-wider"
                disabled={loading || actionInProgress !== null}
                onClick={onStop}
                size="xs"
                variant="outline"
              >
                {actionInProgress === "Stop Workstation"
                  ? "Stopping..."
                  : "Stop"}
              </Button>
            ) : (
              <Button
                className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight sm:px-2.5 sm:tracking-wider"
                disabled={loading || actionInProgress !== null}
                onClick={onStart}
                size="xs"
                variant="outline"
              >
                {actionInProgress === "Start Workstation"
                  ? "Starting..."
                  : "Start"}
              </Button>
            )}

            {appRunning ? (
              <Button
                className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 border-amber-500/30 sm:px-2.5 sm:tracking-wider"
                disabled={loading || actionInProgress !== null}
                onClick={onStopApp}
                size="xs"
                variant="outline"
              >
                {actionInProgress === "Stop App" ? "Stopping..." : "Stop App"}
              </Button>
            ) : (
              <div
                className={cn(
                  "relative inline-flex group/runapp",
                  !workstationRunning && "cursor-not-allowed"
                )}
                title={!workstationRunning ? "First start AI Workstation" : undefined}
              >
                <Button
                  className={cn(
                    "h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight sm:px-2.5 sm:tracking-wider",
                    !workstationRunning &&
                      "bg-zinc-400 text-white hover:bg-zinc-400 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-600 pointer-events-none border-transparent opacity-85 shadow-none"
                  )}
                  disabled={loading || actionInProgress !== null || !workstationRunning}
                  onClick={onRun}
                  size="xs"
                  variant="default"
                >
                  {actionInProgress === "Run App" || actionInProgress === "Start App"
                    ? "Starting..."
                    : "Run App"}
                </Button>

                {!workstationRunning && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden whitespace-nowrap border border-border bg-popover px-2 py-0.5 font-mono text-[10px] text-popover-foreground shadow-md group-hover/runapp:flex items-center gap-1.5 z-50 animate-in fade-in-0 zoom-in-95">
                    <span className="size-1 rounded-full bg-amber-500 shrink-0" />
                    First start AI Workstation
                  </div>
                )}
              </div>
            )}

            <Button
              className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight sm:px-2.5 sm:tracking-wider"
              disabled={loading}
              onClick={onPreview}
              size="xs"
              variant="outline"
            >
              Preview ↗
            </Button>

            <Button
              className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight sm:px-2.5 sm:tracking-wider"
              disabled={loading || actionInProgress !== null || !appRunning}
              onClick={onRestart}
              size="xs"
              variant="outline"
            >
              {actionInProgress === "App Restart" ? "Restarting..." : "Restart"}
            </Button>

            <Button
              className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-tight sm:px-2.5 sm:tracking-wider"
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
          <div className="border-border/60 border-t bg-black p-3.5 font-mono text-xs">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-500">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "font-bold shrink-0",
                      actionFeedback.ok ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    mosabbir@cloud:~$
                  </span>
                  <span className="font-semibold text-zinc-100 break-all">
                    {actionFeedback.command}
                  </span>
                  <span
                    className={cn(
                      "border px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider shrink-0",
                      actionFeedback.ok
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    )}
                  >
                    {actionFeedback.ok ? "0 (SUCCESS)" : "1 (FAILED)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <span className="text-[10px] text-zinc-500">
                    {actionFeedback.timestamp}
                  </span>
                  <CopyButton
                    className="h-5 w-5 p-0.5 text-zinc-400 hover:text-zinc-100"
                    text={actionFeedback.fullOutput}
                  />
                  {onDismissFeedback && (
                    <button
                      className="cursor-pointer px-1 font-mono text-xs text-zinc-500 hover:text-zinc-200"
                      onClick={onDismissFeedback}
                      title="Dismiss"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <pre
                className={cn(
                  "max-h-56 select-text overflow-y-auto whitespace-pre-wrap break-all rounded border p-2.5 font-mono text-xs leading-relaxed",
                  actionFeedback.ok
                    ? "border-zinc-800/60 bg-zinc-950/70 text-zinc-300"
                    : "border-rose-950/80 bg-zinc-950/70 text-rose-300"
                )}
              >
                {actionFeedback.fullOutput}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Second Row: 5-Column CAD Service Cells ([S-01] – [S-05]) */}
      <div className="relative w-full min-w-0 max-w-full overflow-visible">
        <div className="grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((svc) => (
            <div
              className="group flex w-full min-w-0 flex-col justify-between border-border border-r border-b bg-white transition-colors hover:bg-muted/10 dark:bg-black"
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
  const [currentOrigin, setCurrentOrigin] = useState<string>("Same-origin endpoint");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const anywhereAppUrl =
    previewData?.anywhereApp || "Not configured (run 'ai tunnel setup')";
  const anywhereDshUrl =
    previewData?.anywhereDsh || "Not configured";
  const worktreePath = activeProject
    ? `/workspace/projects/${activeProject.name}`
    : "No workspace mounted";
  const remoteOriginUrl = activeProject
    ? `origin/${activeProject.name}`
    : "—";

  return (
    <CadGridFrame>
      <div className="relative w-full min-w-0 max-w-full overflow-visible">
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 md:grid-cols-12">
          {/* Left 6 cols: [W-01] Active Workspace Repository */}
          <div className="col-span-full flex w-full min-w-0 max-w-full flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
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

              {/* Body (p-3.5 sm:p-5 space-y-4 sm:space-y-5 matches [W-02] exactly) */}
              <div className="space-y-4 sm:space-y-5 p-3.5 sm:p-5">
                <div>
                  <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Repository & Worktree Allocation
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                          {activeProject?.name || "None"}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            activeProject ? "bg-emerald-500" : "bg-muted-foreground/40"
                          )}
                        />
                      </div>
                      <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                        Target Repo
                      </span>
                    </div>

                    <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                          {activeProject?.branch ? `⎇ ${activeProject.branch}` : "—"}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            activeProject ? "bg-emerald-500" : "bg-muted-foreground/40"
                          )}
                        />
                      </div>
                      <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                        Checked-Out Ref
                      </span>
                    </div>

                    <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm tabular-nums">
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
                      <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                        Working Tree
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-border/50 border-t pt-3 sm:pt-4">
                  <div className="mb-1.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Revision State & Mounted Endpoints
                  </div>
                  <div className="divide-y divide-border/60 border border-border/70 bg-muted/15">
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
                        className="flex items-center justify-between gap-2.5 px-3 py-1.5 sm:py-2"
                        key={item.label}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono text-[9px] text-muted-foreground/70 uppercase tracking-wider">
                            {item.label}
                          </div>
                          <div
                            className="mt-0.5 truncate font-mono text-foreground text-xs"
                            title={item.value}
                          >
                            {item.value}
                          </div>
                        </div>
                        <CopyButton
                          aria-label={`Copy ${item.label}`}
                          className="h-6 w-6 shrink-0 rounded-none border border-border/60"
                          text={item.value}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CAD Footer bar (h-9 matches [W-02] exactly) */}
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-border/60 border-t bg-muted/10 px-3.5 py-1.5 font-mono text-[9px] text-muted-foreground/60 sm:h-9 sm:flex-nowrap sm:px-4 sm:py-0 sm:text-[10px]">
              <span className="min-w-0 flex-1 truncate">VCS · Git Worktree Mount Status</span>
              <span className="shrink-0 truncate max-w-[160px] sm:max-w-none">HEAD → {activeProject?.branch || "None"}</span>
            </div>
          </div>

          {/* Right 6 cols: [W-02] Port & Edge Ingress Map */}
          <div className="col-span-full flex w-full min-w-0 max-w-full flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
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

              <div className="space-y-4 sm:space-y-5 p-3.5 sm:p-5">
                <div>
                  <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Host-Bound Port Allocations
                  </div>
                  <div className="grid w-full min-w-0 grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      { port: "3000", service: "App (Next.js)" },
                      { port: "8080", service: "DSH RPC" },
                      { port: "4040", service: "Tunnel" },
                      { port: "9000", service: "Broker IPC" },
                      { port: "22", service: "SSH" },
                    ].map((item) => (
                      <div
                        className="flex min-w-0 flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-2.5 sm:py-2 transition-colors hover:bg-muted/30"
                        key={item.port}
                      >
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm tabular-nums">
                            :{item.port}
                          </span>
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                        </div>
                        <span className="mt-0.5 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                          {item.service}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-border/50 border-t pt-3 sm:pt-4">
                  <div className="mb-1.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    Routed Ingress Endpoints
                  </div>
                  <div className="w-full min-w-0 divide-y divide-border/60 border border-border/70 bg-muted/15">
                    {[
                      {
                        label: "Current Origin",
                        url: currentOrigin,
                      },
                      { label: "Anywhere App Edge", url: anywhereAppUrl },
                      { label: "Anywhere DSH Harness", url: anywhereDshUrl },
                    ].map((endpoint) => (
                      <div
                        className="flex items-center justify-between gap-2.5 px-3 py-1.5 sm:py-2"
                        key={endpoint.label}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono text-[9px] text-muted-foreground/70 uppercase tracking-wider">
                            {endpoint.label}
                          </div>
                          <div
                            className="mt-0.5 truncate font-mono text-foreground text-xs"
                            suppressHydrationWarning
                            title={endpoint.url}
                          >
                            {endpoint.url}
                          </div>
                        </div>
                        <CopyButton
                          aria-label={`Copy ${endpoint.label}`}
                          className="h-6 w-6 shrink-0 rounded-none border border-border/60"
                          text={endpoint.url}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CAD Footer bar (h-9 matches [W-01] exactly) */}
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-border/60 border-t bg-muted/10 px-3.5 py-1.5 font-mono text-[9px] text-muted-foreground/60 sm:h-9 sm:flex-nowrap sm:px-4 sm:py-0 sm:text-[10px]">
              <span className="min-w-0 flex-1 truncate">Ingress · Cloudflare Zero Trust</span>
              <span className="shrink-0">TLS 1.3 Active</span>
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

function LogsAndNotesGrid({
  appRunning,
  onOpenFullLogs,
}: {
  appRunning: boolean;
  onOpenFullLogs?: () => void;
}) {
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
      <div className="relative w-full min-w-0 max-w-full overflow-visible">
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 md:grid-cols-12">
          {/* Left 6 cols: Mini Log Tail */}
          <div className="col-span-full flex w-full min-w-0 max-w-full flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
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
              autoConnect={appRunning}
              className="h-full border-0 shadow-none"
              compact
              endpoint="/api/logs/app"
              maxLines={15}
              title="[L-01] Live App Log Tail"
            />
          </div>

          {/* Right 6 cols: Operator Notes Scratchpad */}
          <div className="col-span-full flex w-full min-w-0 max-w-full flex-col justify-between border-border border-r border-b bg-white md:col-span-6 dark:bg-black">
            {/* CAD Header bar (min-h-11 matches [L-01] exactly) */}
            <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-border/60 border-b bg-card/30 px-3.5 py-2 sm:flex-nowrap sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                  [L-02]
                </span>
                <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
                  Operator Notes
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto sm:shrink-0">
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
              <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="mr-1 shrink-0 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Quick Insert:
                </span>
                {QUICK_NOTE_TEMPLATES.map((item) => (
                  <button
                    className="shrink-0 whitespace-nowrap border border-border/70 bg-muted/15 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 hover:text-foreground"
                    key={item.label}
                    onClick={() => handleAppendSnippet(item.snippet)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                className="min-h-[144px] w-full flex-1 resize-none rounded-none border border-border/70 bg-muted/15 p-3 font-mono text-foreground text-base sm:text-xs leading-relaxed placeholder:text-muted-foreground/40 focus:border-foreground/50 focus:outline-none"
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={
                  "// Operational scratchpad (persisted in browser localStorage).\n// Click a Quick Insert tag above or type runbook notes..."
                }
                spellCheck={false}
                value={notes}
              />
            </div>

            {/* CAD Footer bar (h-9 matches [L-01] exactly) */}
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-border/60 border-t bg-muted/10 px-3.5 py-1.5 font-mono text-[9px] text-muted-foreground/60 sm:h-9 sm:flex-nowrap sm:px-4 sm:py-0 sm:text-[10px]">
              <span className="min-w-0 flex-1 truncate">Storage · localStorage (Browser Local)</span>
              <span className="shrink-0">
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
  const [actionFeedback, setActionFeedback] =
    useState<ActionFeedbackInfo | null>(null);

  const [telemetryMetrics, setTelemetryMetrics] =
    useState<WorkstationTelemetryMetrics | null>(
      () => lastOverviewCache?.telemetryMetrics ?? null
    );
  const [healthOk, setHealthOk] = useState<boolean | null>(
    () => lastOverviewCache?.healthOk ?? null
  );
  const [workstationRunning, setWorkstationRunning] = useState<boolean>(
    () => lastOverviewCache?.workstationRunning ?? false
  );
  const [appPid, setAppPid] = useState<string | null>(
    () => lastOverviewCache?.appPid ?? null
  );
  const [appRunning, setAppRunning] = useState<boolean>(
    () => lastOverviewCache?.appRunning ?? false
  );
  const [harnessActive, setHarnessActive] = useState<boolean>(
    () => lastOverviewCache?.harnessActive ?? false
  );
  const [brokerOnline, setBrokerOnline] = useState<boolean>(
    () => lastOverviewCache?.brokerOnline ?? false
  );
  const [tunnelOnline, setTunnelOnline] = useState<boolean>(
    () => lastOverviewCache?.tunnelOnline ?? false
  );

  const [activeProject, setActiveProject] =
    useState<ActiveProjectGitInfo | null>(
      () => lastOverviewCache?.activeProject ?? null
    );

  const [previewData, setPreviewData] = useState<PreviewResponse | null>(
    () => lastOverviewCache?.previewData ?? null
  );

  const isFetchingRef = useRef(false);

  const refreshAllTelemetry = useCallback(async (force = false) => {
    if (isFetchingRef.current && !force) return;
    isFetchingRef.current = true;
    try {
      setLoading(true);

      const ov = await workstationApi.getOverview();
      if (ov?.ok) {
        const isHealthy = ov.health !== false;
        setHealthOk(isHealthy);
        setBrokerOnline(ov.broker?.online ?? false);
        setWorkstationRunning(ov.workstation?.running ?? false);
        const isAppActive = Boolean(
          ov.app?.running &&
            ov.app?.pid &&
            ov.app.pid !== "—" &&
            ov.app.pid !== "none"
        );
        setAppRunning(isAppActive);
        setAppPid(isAppActive ? (ov.app?.pid ?? null) : null);
        setHarnessActive(ov.harness?.active ?? false);
        setTunnelOnline(ov.tunnel?.online ?? false);
        if (ov.activeProject) {
          setActiveProject(ov.activeProject);
        }
        const nextPreviewData: PreviewResponse = {
          ok: true,
          text: "",
          anywhereApp: ov.preview?.anywhereApp || "",
          anywhereDsh: ov.preview?.anywhereDsh || "",
        };
        if (ov.preview) {
          setPreviewData(nextPreviewData);
        }
        if (ov.metrics) {
          setTelemetryMetrics(ov.metrics);
        }

        lastOverviewCache = {
          healthOk: isHealthy,
          workstationRunning: ov.workstation?.running ?? false,
          appRunning: isAppActive,
          appPid: isAppActive ? (ov.app?.pid ?? null) : null,
          harnessActive: ov.harness?.active ?? false,
          brokerOnline: ov.broker?.online ?? false,
          tunnelOnline: ov.tunnel?.online ?? false,
          activeProject: ov.activeProject ?? null,
          previewData: nextPreviewData,
          telemetryMetrics: ov.metrics ?? null,
        };
      }
    } catch {
      // Backend offline or unreachable
      setHealthOk(false);
      setBrokerOnline(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshAllTelemetry();
  }, [refreshAllTelemetry]);

  const executeQuickAction = async (
    name: string,
    command: string,
    actionFn: () => Promise<{ ok: boolean; output: string }>
  ) => {
    const getTimestamp = () =>
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    try {
      setActionInProgress(name);
      setActionFeedback(null);
      const res = await actionFn();
      const trimmedOutput = (res.output || "").trim();
      const lines = trimmedOutput
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      let headline = "";
      if (lines.length > 0) {
        const errorLine = lines.find((l) =>
          l.toLowerCase().includes("error:")
        );
        headline = errorLine
          ? errorLine.replace(/^ERROR:\s*/i, "")
          : lines[lines.length - 1];
      } else {
        headline = res.ok
          ? "Operation completed successfully."
          : "Action failed.";
      }

      if (res.ok) {
        if (name === "Start Workstation") setWorkstationRunning(true);
        if (name === "Stop Workstation") setWorkstationRunning(false);
        if (name === "Start App" || name === "Run App") setAppRunning(true);
        if (name === "Stop App") {
          setAppRunning(false);
          setAppPid(null);
        }
      }

      if (
        trimmedOutput.includes("Project is not running") ||
        trimmedOutput.includes("Project stopped")
      ) {
        setAppRunning(false);
        setAppPid(null);
      }

      setActionFeedback({
        ok: Boolean(res.ok),
        command,
        actionName: name,
        title: res.ok ? "SUCCESS" : "ERROR",
        headline,
        fullOutput: trimmedOutput,
        timestamp: getTimestamp(),
      });
      await refreshAllTelemetry(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setActionFeedback({
        ok: false,
        command,
        actionName: name,
        title: "ERROR",
        headline: errMsg,
        fullOutput: errMsg,
        timestamp: getTimestamp(),
      });
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
    workstationState = workstationRunning ? "healthy" : "inactive";
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
        onDismissFeedback={() => setActionFeedback(null)}
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
        onRefresh={() => refreshAllTelemetry(true)}
        workstationRunning={workstationRunning}
        onStart={() =>
          executeQuickAction(
            "Start Workstation",
            "ai start",
            workstationApi.startWorkstation
          )
        }
        onStop={() =>
          executeQuickAction(
            "Stop Workstation",
            "ai stop",
            workstationApi.stopWorkstation
          )
        }
        onRun={() => executeQuickAction("Run App", "ai run", workstationApi.appRun)}
        onStopApp={() =>
          executeQuickAction("Stop App", "ai app stop", workstationApi.appStop)
        }
        onRestart={() =>
          executeQuickAction("App Restart", "ai app restart", workstationApi.appRestart)
        }
        tunnelOnline={tunnelOnline}
        tunnelState={tunnelState}
        workstationState={workstationState}
      />

      {/* 2. LIVE CAD TELEMETRY MATRIX */}
      <TelemetryShowcaseGrid loading={loading} metrics={telemetryMetrics} />

      {/* 3. WORKSPACE GIT TREE + PORT & EDGE INGRESS MAP */}
      <WorkspaceAndIngressGrid
        activeProject={activeProject}
        onManageProjects={() => onSelectTab?.("projects")}
        onOpenGitSync={() => onSelectTab?.("git")}
        onOpenTunnel={() => onSelectTab?.("tunnel")}
        previewData={previewData}
      />

      {/* 4. LIVE LOG STREAM + OPERATOR SCRATCHPAD */}
      <LogsAndNotesGrid
        appRunning={appRunning}
        onOpenFullLogs={() => onSelectTab?.("app")}
      />
    </div>
  );
}
