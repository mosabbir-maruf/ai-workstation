"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { SseLogViewer } from "../sse-log-viewer";
import { VerbatimOutput } from "../verbatim-output";

export function AppSection() {
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamKey, setStreamKey] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getAppStatus();
      setAppStatus(res.output);
    } catch (err) {
      setAppStatus(`Status fetch error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const telemetry = useMemo(() => {
    const raw = appStatus ?? "";
    const isRunning = /Status:\s*running/i.test(raw);
    const portMatch = raw.match(/Port:\s*(:?\d+)/i);
    const projMatch = raw.match(/Project:\s*([^\r\n]+)/i);
    const pidMatch = raw.match(/PID:\s*([^\r\n]+)/i);
    const port = portMatch
      ? portMatch[1].startsWith(":")
        ? portMatch[1]
        : `:${portMatch[1]}`
      : ":5173";
    const project = projMatch ? projMatch[1].trim() : "none";
    const pid = pidMatch ? pidMatch[1].trim() : null;
    return { isRunning, port, project, pid };
  }, [appStatus]);

  const handleAction = async (
    fn: () => Promise<{ ok: boolean; output: string }>
  ) => {
    try {
      setLoading(true);
      const res = await fn();
      setActionOutput(res.output);
      setActionOk(res.ok ?? true);
      await fetchStatus();
      setStreamKey((k) => k + 1);
    } catch (err) {
      setActionOutput(`Action error: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const dotClass = telemetry.isRunning
    ? "size-1.5 rounded-full bg-emerald-500"
    : "size-1.5 rounded-full bg-muted-foreground/40";

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: [A-01] App Process Controls + [A-02] Process Supervisor Diagnostics */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/app/run · restart · stop"
              footerRight={`Port ${telemetry.port.replace(":", "")} · HTTP/1.1 & WS`}
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchStatus}
                  size="xs"
                  variant="outline"
                >
                  Poll Status ↻
                </Button>
              }
              index="A-01"
              title="Application Process Controls"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Runtime Target Specification
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold font-mono text-foreground text-xs sm:text-sm tabular-nums truncate">
                        {telemetry.isRunning ? telemetry.port : "IDLE"}
                      </span>
                      <span className={dotClass} />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Bound Socket
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        {telemetry.project !== "none"
                          ? telemetry.project
                          : "None"}
                      </span>
                      <span className={dotClass} />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Active Project
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        {telemetry.isRunning
                          ? telemetry.pid
                            ? `PID ${telemetry.pid}`
                            : "Running"
                          : "Stopped"}
                      </span>
                      <span className={dotClass} />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Process State
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 border-border/50 border-t pt-4">
                <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Lifecycle Execution Triggers
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    className="h-9 rounded-none font-mono text-xs uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => handleAction(workstationApi.appRun)}
                    size="sm"
                    variant="default"
                  >
                    Run App
                  </Button>
                  <Button
                    className="h-9 rounded-none font-mono text-xs uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => handleAction(workstationApi.appRestart)}
                    size="sm"
                    variant="outline"
                  >
                    Restart App
                  </Button>
                  <Button
                    className="h-9 rounded-none font-mono text-xs uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => handleAction(workstationApi.appStop)}
                    size="sm"
                    variant="destructive"
                  >
                    Stop Process
                  </Button>
                  <Button
                    className="h-9 rounded-none font-mono text-xs uppercase tracking-wider"
                    disabled={loading}
                    onClick={fetchStatus}
                    size="sm"
                    variant="outline"
                  >
                    Poll Status ↻
                  </Button>
                </div>
              </div>

              {actionOutput && (
                <div className="space-y-1.5 border-border/50 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                      Process Action Output
                    </span>
                    <button
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => {
                        setActionOutput(null);
                        setActionOk(null);
                      }}
                      type="button"
                    >
                      Clear ✕
                    </button>
                  </div>
                  <VerbatimOutput
                    label="Last Action Result"
                    ok={actionOk ?? true}
                    output={actionOutput}
                    preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                  />
                </div>
              )}
            </CadCell>

            <CadCell
              className="md:col-span-6"
              footerLeft="GET /api/app/status · Live PID & Socket Telemetry"
              footerRight={`Supervisor: ${telemetry.isRunning ? "Running" : "Stopped"}`}
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchStatus}
                  size="xs"
                  variant="ghost"
                >
                  Refresh ↻
                </Button>
              }
              index="A-02"
              title="Process Supervisor Diagnostics"
            >
              <VerbatimOutput label="GET /api/app/status" output={appStatus} />
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

      {/* Row 2: [A-03] Live SSE Application Logs */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="border-border border-r border-b bg-white dark:bg-black">
            <SseLogViewer
              className="border-0 shadow-none"
              endpoint="/api/logs/app"
              key={streamKey}
              title="[A-03] Live Application Process Log Stream"
            />
          </div>
          <GridCornerDots
            className="z-3 hidden md:block"
            columns={1}
            rows={1}
          />
        </div>
      </CadGridFrame>
    </div>
  );
}
