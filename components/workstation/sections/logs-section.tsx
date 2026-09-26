"use client";

import { useMemo, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { SseLogViewer } from "../sse-log-viewer";

type LogChannelId = "workstation" | "app" | "tunnel";

interface LogChannelSpec {
  id: LogChannelId;
  code: string;
  label: string;
  title: string;
  endpoint: string;
  subsystem: string;
  description: string;
}

const LOG_CHANNELS: readonly LogChannelSpec[] = [
  {
    id: "workstation",
    code: "HOST",
    label: "Workstation Host",
    title: "Global Workstation Daemon Event Stream",
    endpoint: "/api/logs/workstation",
    subsystem: "workstation-supervisor",
    description:
      "OS kernel hooks, supervisor lifecycle events, and daemon heartbeats",
  },
  {
    id: "app",
    code: "APP",
    label: "Application Runtime",
    title: "Application Process stdout/stderr Stream",
    endpoint: "/api/logs/app",
    subsystem: "next-turbo-runner",
    description:
      "Next.js dev/prod server output, SSR traces, and Turborepo pipeline logs",
  },
  {
    id: "tunnel",
    code: "EDGE",
    label: "Cloudflare Tunnel",
    title: "Cloudflared Edge Ingress Log Stream",
    endpoint: "/api/tunnel/logs",
    subsystem: "cloudflared-connector",
    description:
      "QUIC/HTTP2 edge tunnel handshakes, origin proxy status, and TLS ingress",
  },
] as const;

const BUFFER_PRESETS = [500, 1500, 2500, 5000] as const;

export function LogsSection() {
  const [primaryId, setPrimaryId] = useState<LogChannelId>("workstation");
  const [secondaryId, setSecondaryId] = useState<LogChannelId>("app");
  const [maxLines, setMaxLines] = useState<number>(2500);
  const [dualStream, setDualStream] = useState<boolean>(false);

  const primaryChannel = useMemo(
    () =>
      (LOG_CHANNELS.find((c) => c.id === primaryId) ??
        LOG_CHANNELS[0]) as LogChannelSpec,
    [primaryId]
  );

  const secondaryChannel = useMemo(
    () =>
      (LOG_CHANNELS.find((c) => c.id === secondaryId) ??
        LOG_CHANNELS[1]) as LogChannelSpec,
    [secondaryId]
  );

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: Balanced 6/6 CAD Grid — Stream Multiplexer + Ring Buffer Policy */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [LG-01] Log Stream Multiplexer & Channel Selector */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Server-Sent Events (SSE) log router"
              footerRight="GET /api/logs/*"
              headerAction={
                <div className="flex items-center gap-1">
                  {LOG_CHANNELS.map((ch) => (
                    <Button
                      className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                      key={ch.id}
                      onClick={() => setPrimaryId(ch.id)}
                      size="sm"
                      type="button"
                      variant={primaryId === ch.id ? "default" : "outline"}
                    >
                      {ch.code}
                    </Button>
                  ))}
                </div>
              }
              index="LG-01"
              title="Log Stream Multiplexer"
            >
              {/* Top: 3-Column Stream Multiplexer Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Active Stream Specification
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {primaryChannel.subsystem}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Primary Feed
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
                      <span className="truncate font-bold font-mono text-foreground text-xs">
                        {primaryChannel.code}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Transport
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      SSE / HTTP
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Endpoint
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-emerald-500 text-xs">
                      {primaryChannel.endpoint.replace("/api/logs/", "/")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Interactive Channel Directory */}
              <div className="space-y-2 border-border/50 border-t pt-4">
                <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Available SSE Telemetry Channels
                </span>
                <div className="divide-y divide-border/60 border border-border/60 bg-muted/5">
                  {LOG_CHANNELS.map((ch) => {
                    const isPrimary = primaryId === ch.id;
                    return (
                      <div
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 transition-colors",
                          isPrimary ? "bg-muted/20" : "hover:bg-muted/10"
                        )}
                        key={ch.id}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                isPrimary
                                  ? "bg-emerald-500"
                                  : "bg-muted-foreground/40"
                              )}
                            />
                            <span className="font-bold font-mono text-foreground text-xs">
                              {ch.label}
                            </span>
                            <span className="border border-border/60 bg-muted/15 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                              {ch.endpoint}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                            {ch.description}
                          </p>
                        </div>
                        <Button
                          className="h-6 shrink-0 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                          onClick={() => setPrimaryId(ch.id)}
                          size="sm"
                          type="button"
                          variant={isPrimary ? "default" : "outline"}
                        >
                          {isPrimary ? "Active" : "Mount"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CadCell>

            {/* [LG-02] Ring Buffer & Stream Retention Policy */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Client ring-buffer & viewport layout"
              footerRight="FIFO STREAM GC"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    onClick={() => {
                      setMaxLines(2500);
                      setDualStream(false);
                      setPrimaryId("workstation");
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Reset
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    onClick={() => setDualStream((prev) => !prev)}
                    size="sm"
                    type="button"
                    variant={dualStream ? "default" : "outline"}
                  >
                    {dualStream ? "Dual Split: ON" : "Dual Split: OFF"}
                  </Button>
                </>
              }
              index="LG-02"
              title="Ring Buffer & Viewport Policy"
            >
              {/* Top: 3-Column Buffer & Layout Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Memory & Layout Specification
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    client-ring-buffer
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Ring Capacity
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {maxLines.toLocaleString()} LINES
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Viewport Grid
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-emerald-500 text-xs">
                      {dualStream ? "6/6 SPLIT" : "12-COL FULL"}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Eviction Mode
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      FIFO DROP
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Ring Buffer Size Selector + Split Stream Pairing */}
              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="space-y-1.5">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Ring Buffer Line Retention Limit
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {BUFFER_PRESETS.map((limit) => (
                      <Button
                        className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                        key={limit}
                        onClick={() => setMaxLines(limit)}
                        size="sm"
                        type="button"
                        variant={maxLines === limit ? "default" : "outline"}
                      >
                        {limit.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Secondary Split-View Channel ([LG-04])
                    </span>
                    <div className="flex items-center gap-1">
                      {LOG_CHANNELS.map((ch) => (
                        <button
                          className={cn(
                            "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors",
                            secondaryId === ch.id
                              ? "border-foreground bg-foreground text-background"
                              : "border-border/60 bg-muted/10 text-muted-foreground hover:border-border hover:text-foreground"
                          )}
                          key={ch.id}
                          onClick={() => {
                            setSecondaryId(ch.id);
                            setDualStream(true);
                          }}
                          type="button"
                        >
                          {ch.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-border/50 border border-border/60 bg-muted/5 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Primary Console ([LG-03])
                      </span>
                      <span className="text-foreground">
                        {primaryChannel.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Secondary Console ([LG-04])
                      </span>
                      <span
                        className={
                          dualStream
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                        }
                      >
                        {dualStream
                          ? secondaryChannel.endpoint
                          : "STANDBY (ENABLE DUAL SPLIT)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Line Framing & Auto-Follow
                      </span>
                      <span className="text-emerald-500">
                        UTF-8 / TAIL-LOCK
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CadCell>
          </div>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={2}
            columnWeights={[6, 6]}
            rows={1}
          />
        </div>
      </CadGridFrame>

      {/* Row 2: Live SSE Log Stream Console (12-Col Full or 6/6 Dual Split) */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          {dualStream ? (
            <>
              <div className="grid w-full grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-6">
                  <SseLogViewer
                    className="h-[500px] border-r border-b"
                    endpoint={primaryChannel.endpoint}
                    key={`primary-${primaryChannel.id}-${maxLines}`}
                    maxLines={maxLines}
                    title={`[LG-03] ${primaryChannel.title}`}
                  />
                </div>
                <div className="md:col-span-6">
                  <SseLogViewer
                    className="h-[500px] border-r border-b"
                    endpoint={secondaryChannel.endpoint}
                    key={`secondary-${secondaryChannel.id}-${maxLines}`}
                    maxLines={maxLines}
                    title={`[LG-04] ${secondaryChannel.title}`}
                  />
                </div>
              </div>

              <GridCornerDots
                className="z-3 hidden md:block"
                columns={2}
                columnWeights={[6, 6]}
                rows={1}
              />
            </>
          ) : (
            <>
              <SseLogViewer
                className="h-[500px] border-r border-b"
                endpoint={primaryChannel.endpoint}
                key={`single-${primaryChannel.id}-${maxLines}`}
                maxLines={maxLines}
                title={`[LG-03] ${primaryChannel.title}`}
              />

              <GridCornerDots
                className="z-3 hidden md:block"
                columns={1}
                rows={1}
              />
            </>
          )}
        </div>
      </CadGridFrame>
    </div>
  );
}
