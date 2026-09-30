"use client";

import { useCallback, useEffect, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { SseLogViewer } from "../sse-log-viewer";
import { VerbatimOutput } from "../verbatim-output";

export function TunnelSection() {
  const [tunnelStatus, setTunnelStatus] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"control" | "setup" | null>(null);
  const [actionOk, setActionOk] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [appHost, setAppHost] = useState("");
  const [dshHost, setDshHost] = useState("");
  const [appPort, setAppPort] = useState("3000");
  const [syncPort, setSyncPort] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getTunnelStatus();
      setTunnelStatus(res.output);
    } catch (err) {
      setTunnelStatus(`Failed to fetch tunnel status: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleStart = async () => {
    try {
      setLoading(true);
      setLastAction("control");
      const res = await workstationApi.startTunnel();
      setActionOutput(res.output);
      setActionOk(res.ok ?? true);
      await fetchStatus();
    } catch (err) {
      setActionOutput(`Tunnel start error: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      setLastAction("control");
      const res = await workstationApi.stopTunnel();
      setActionOutput(res.output);
      setActionOk(res.ok ?? true);
      await fetchStatus();
    } catch (err) {
      setActionOutput(`Tunnel stop error: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setLastAction("setup");
      const res = await workstationApi.setupTunnel({
        token: token.trim() || undefined,
        appHost: appHost.trim() || undefined,
        dshHost: dshHost.trim() || undefined,
        appPort: appPort ? Number(appPort) : undefined,
      });
      setActionOutput(res.output);
      setActionOk(res.ok ?? true);
      await fetchStatus();
    } catch (err) {
      setActionOutput(`Tunnel setup error: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setLastAction("control");
      const res = await workstationApi.syncTunnel(
        syncPort ? Number(syncPort) : undefined
      );
      setActionOutput(res.output);
      setActionOk(res.ok ?? true);
      setSyncPort("");
      await fetchStatus();
    } catch (err) {
      setActionOutput(`Tunnel sync error: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: [TN-01] Cloudflare Edge Connector Controls + [TN-02] Tunnel Ingress Configuration */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* Left 6 cols: [TN-01] Cloudflare Edge Tunnel Controls */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/tunnel/start · stop · sync"
              footerRight="Transport · QUIC / HTTP2"
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
              index="TN-01"
              title="Cloudflare Edge Connector Controls"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Edge Connector Specification
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        QUIC / H2
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Edge Transport
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm tabular-nums">
                        4 Colos
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Active PoPs
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm tabular-nums">
                        :4040
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Metrics Socket
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Connector Daemon Lifecycle
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    className="h-9 rounded-none font-mono text-xs uppercase tracking-wider"
                    disabled={loading}
                    onClick={handleStart}
                    size="sm"
                    variant="default"
                  >
                    Start Tunnel
                  </Button>
                  <Button
                    className="h-9 rounded-none font-mono text-xs uppercase tracking-wider"
                    disabled={loading}
                    onClick={handleStop}
                    size="sm"
                    variant="destructive"
                  >
                    Stop Tunnel
                  </Button>
                </div>

                <form
                  className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1"
                  onSubmit={handleSync}
                >
                  <Input
                    className="h-9 flex-1 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                    disabled={loading}
                    onChange={(e) => setSyncPort(e.target.value)}
                    placeholder="Override Local App Port (e.g. 3000)"
                    type="number"
                    value={syncPort}
                  />
                  <Button
                    className="h-9 shrink-0 rounded-none px-3.5 font-mono text-xs uppercase tracking-wider w-full sm:w-auto"
                    disabled={loading}
                    type="submit"
                    variant="outline"
                  >
                    Sync Port ↻
                  </Button>
                </form>

                {lastAction === "control" && actionOutput && (
                  <div className="border-border/50 border-t pt-3">
                    <VerbatimOutput
                      label="Tunnel Operation Result"
                      ok={actionOk ?? true}
                      onClear={() => {
                        setActionOutput(null);
                        setLastAction(null);
                        setActionOk(null);
                      }}
                      output={actionOutput}
                      preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                    />
                  </div>
                )}
              </div>
            </CadCell>

            {/* Right 6 cols: [TN-02] Tunnel Ingress Configuration */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/tunnel/setup · Named Tunnel Routing"
              footerRight="Zero-Trust Ingress"
              index="TN-02"
              title="Tunnel Ingress Configuration"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Ingress Routing Policy
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        Zero Trust
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Access Policy
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        CNAME
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      DNS Routing
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        TLS 1.3
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Edge Cipher
                    </span>
                  </div>
                </div>
              </div>

              <form
                className="space-y-3 border-border/50 border-t pt-4"
                onSubmit={handleSetup}
              >
                <div className="space-y-1">
                  <label
                    className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                    htmlFor="tunnel-token"
                  >
                    Cloudflare Tunnel Token (Secret)
                  </label>
                  <Input
                    className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                    disabled={loading}
                    id="tunnel-token"
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhIjoiOTFhOGViZTY..."
                    type="password"
                    value={token}
                  />
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label
                      className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                      htmlFor="app-host"
                    >
                      App Hostname
                    </label>
                    <Input
                      className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                      disabled={loading}
                      id="app-host"
                      onChange={(e) => setAppHost(e.target.value)}
                      placeholder="app.domain.com"
                      value={appHost}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                      htmlFor="dsh-host"
                    >
                      DSH Hostname
                    </label>
                    <Input
                      className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                      disabled={loading}
                      id="dsh-host"
                      onChange={(e) => setDshHost(e.target.value)}
                      placeholder="dsh.domain.com"
                      value={dshHost}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                      htmlFor="app-port"
                    >
                      Origin Port
                    </label>
                    <Input
                      className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                      disabled={loading}
                      id="app-port"
                      onChange={(e) => setAppPort(e.target.value)}
                      placeholder="3000"
                      type="number"
                      value={appPort}
                    />
                  </div>
                </div>

                <Button
                  className="h-9 w-full rounded-none font-mono text-xs uppercase tracking-wider"
                  disabled={loading}
                  type="submit"
                >
                  <span className="sm:hidden">Apply Tunnel Config →</span>
                  <span className="hidden sm:inline">Save & Apply Tunnel Configuration →</span>
                </Button>
              </form>

              {lastAction === "setup" && actionOutput && (
                <div className="border-border/50 border-t pt-3">
                  <VerbatimOutput
                    label="POST /api/tunnel/setup"
                    ok={actionOk ?? true}
                    onClear={() => {
                      setActionOutput(null);
                      setLastAction(null);
                      setActionOk(null);
                    }}
                    output={actionOutput}
                    preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                  />
                </div>
              )}
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

      {/* Row 2: [TN-03] Connector Status Diagnostics */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            <CadCell
              className="md:col-span-12"
              footerLeft="GET /api/tunnel/status"
              footerRight="cloudflared daemon"
              index="TN-03"
              title="Tunnel Connector Status Diagnostics"
            >
              <VerbatimOutput
                label="GET /api/tunnel/status"
                output={tunnelStatus}
              />
            </CadCell>
          </div>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={1}
            rows={1}
          />
        </div>
      </CadGridFrame>

      {/* Row 3: [TN-04] Live SSE Tunnel Edge Stream */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="border-border border-r border-b bg-white dark:bg-black">
            <SseLogViewer
              className="border-0 shadow-none"
              endpoint="/api/tunnel/logs"
              title="[TN-04] Cloudflare Edge Tunnel Log Stream"
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
