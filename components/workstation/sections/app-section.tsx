"use client";

import { useCallback, useEffect, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { SseLogViewer } from "../sse-log-viewer";
import { VerbatimOutput } from "../verbatim-output";

export function AppSection() {
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleAction = async (
    fn: () => Promise<{ ok: boolean; output: string }>
  ) => {
    try {
      setLoading(true);
      const res = await fn();
      setActionOutput(res.output);
      await fetchStatus();
    } catch (err) {
      setActionOutput(`Action error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

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
              footerRight="Port 3000 · HTTP/1.1 & WS"
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
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold font-mono text-foreground text-sm tabular-nums">
                        :3000
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Bound Socket
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        Next.js
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      App Server
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        Daemon
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Supervisor
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
                <div className="pt-1">
                  <VerbatimOutput
                    label="Last Action Result"
                    output={actionOutput}
                  />
                </div>
              )}
            </CadCell>

            <CadCell
              className="md:col-span-6"
              footerLeft="GET /api/app/status · Live PID & Socket Telemetry"
              footerRight="Supervisor: Active"
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
