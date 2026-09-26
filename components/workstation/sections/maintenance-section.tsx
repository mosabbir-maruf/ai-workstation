"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

const DISK_SIZE_REGEX = /(\d+(?:\.\d+)?\s*(?:B|KB|MB|GB|TB|K|M|G))/i;

export function MaintenanceSection() {
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [clearDocker, setClearDocker] = useState(true);
  const [clearLogs, setClearLogs] = useState(true);
  const [clearDeps, setClearDeps] = useState(false);
  const [clearTemp, setClearTemp] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchCache = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getCache();
      setCacheStatus(res.output);
    } catch (err) {
      setCacheStatus(`Failed to fetch cache: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCache();
  }, [fetchCache]);

  const handleAction = async (
    label: string,
    fn: () => Promise<{ ok: boolean; output: string }>
  ) => {
    try {
      setLoading(true);
      const res = await fn();
      setActionOutput(`[${label}]\n${res.output}`);
    } catch (err) {
      setActionOutput(`[${label}] Operation error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async (override?: {
    docker?: boolean;
    logs?: boolean;
    deps?: boolean;
    temp?: boolean;
  }) => {
    const payload = {
      docker: override?.docker ?? clearDocker,
      logs: override?.logs ?? clearLogs,
      deps: override?.deps ?? clearDeps,
      temp: override?.temp ?? clearTemp,
    };
    try {
      setLoading(true);
      const res = await workstationApi.clearCache(payload);
      const activeFlags = Object.entries(payload)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",");
      setActionOutput(
        `[Purge Cache & Subsystems · targets=build${activeFlags ? `,${activeFlags}` : ""}]\n${res.output}`
      );
      await fetchCache();
    } catch (err) {
      setActionOutput(`Cache clear error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const detectedFootprint = useMemo(() => {
    if (!cacheStatus) {
      return "PROBING...";
    }
    const match = cacheStatus.match(DISK_SIZE_REGEX);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
    return "MOUNTED";
  }, [cacheStatus]);

  const selectedTargetsCount = useMemo(
    () =>
      1 +
      Number(clearDocker) +
      Number(clearLogs) +
      Number(clearDeps) +
      Number(clearTemp),
    [clearDeps, clearDocker, clearLogs, clearTemp]
  );

  const allSelected = clearDocker && clearLogs && clearDeps && clearTemp;

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: Balanced 6/6 CAD Grid — System Diagnostics + Cache/Docker/Logs Purge Controls */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [M-01] System & Container Diagnostics */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="OS, Docker daemon & package maintenance"
              footerRight="POST /api/system/*"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={() =>
                    handleAction(
                      "System Doctor Audit",
                      workstationApi.systemDoctor
                    )
                  }
                  size="sm"
                  type="button"
                  variant="default"
                >
                  Run Doctor
                </Button>
              }
              index="M-01"
              title="System & Container Diagnostics"
            >
              {/* Top: 3-Column OS & Container Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Diagnostic & Daemon Scope
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    host-supervisor
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Health Probe
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
                      <span className="truncate font-bold font-mono text-foreground text-xs">
                        DOCTOR
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Docker Engine
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-emerald-500 text-xs">
                      DOCKER.SOCK
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Package Index
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      APT / PNPM
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: Maintenance & Quick Cleanup Triggers */}
              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="space-y-1.5">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    System & Container Runners
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleAction(
                          "System Doctor Audit",
                          workstationApi.systemDoctor
                        )
                      }
                      size="sm"
                      type="button"
                      variant="default"
                    >
                      Doctor Audit
                    </Button>
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleAction(
                          "System Package Update",
                          workstationApi.systemUpdate
                        )
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Sync Index
                    </Button>
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleAction(
                          "System Binary Upgrade",
                          workstationApi.systemUpgrade
                        )
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Upgrade All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleClearCache({
                          docker: true,
                          logs: false,
                          deps: false,
                          temp: true,
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Prune Docker Only
                    </Button>
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleClearCache({
                          docker: false,
                          logs: true,
                          deps: false,
                          temp: true,
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Rotate & Truncate Logs
                    </Button>
                  </div>
                </div>

                {/* Bottom: Diagnostic Verification Checkpoints */}
                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Automated Verification Checkpoints
                  </span>
                  <div className="divide-y divide-border/50 border border-border/60 bg-muted/5 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Docker Daemon & Buildx Socket
                      </span>
                      <span className="text-emerald-500">
                        /var/run/docker.sock
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Toolchain & Node Runtime
                      </span>
                      <span className="text-foreground">v22+ / pnpm / git</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Port & Socket Bindings
                      </span>
                      <span className="text-foreground">
                        3000 / 8080 / 8787
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CadCell>

            {/* [M-02] Cache, Docker & Log Purge Controls */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Build, Docker, log ring & package store purge"
              footerRight="POST /api/cache/clear"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => {
                      const next = !allSelected;
                      setClearDocker(next);
                      setClearLogs(next);
                      setClearDeps(next);
                      setClearTemp(next);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {allSelected ? "Minimal" : "Select All"}
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={fetchCache}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Refresh ↻
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => handleClearCache()}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    Purge Selected
                  </Button>
                </>
              }
              index="M-02"
              title="Cache, Docker & Log Purge Controls"
            >
              {/* Top: 3-Column Cache Store Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Reclaimable Storage Telemetry
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    docker / logs / turbo / store
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Footprint
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {detectedFootprint}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Purge Scope
                    </span>
                    <span
                      className={cn(
                        "mt-1 truncate font-bold font-mono text-xs",
                        clearDeps || clearDocker
                          ? "text-amber-500"
                          : "text-emerald-500"
                      )}
                    >
                      {selectedTargetsCount} / 5 TARGETS
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Engine Scope
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      DOCKER + HOST
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Granular 2x2 Purge Scope Matrix + Summary */}
              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="space-y-1.5">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Granular Subsystem Purge Matrix
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-3 py-2">
                      <div className="min-w-0">
                        <label
                          className="block cursor-pointer truncate font-bold font-mono text-[11px] text-foreground"
                          htmlFor="purge-docker-toggle"
                        >
                          Docker Prune
                        </label>
                        <span className="block truncate font-mono text-[9px] text-muted-foreground">
                          Images, buildx & volumes
                        </span>
                      </div>
                      <Switch
                        checked={clearDocker}
                        id="purge-docker-toggle"
                        onCheckedChange={setClearDocker}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-3 py-2">
                      <div className="min-w-0">
                        <label
                          className="block cursor-pointer truncate font-bold font-mono text-[11px] text-foreground"
                          htmlFor="purge-logs-toggle"
                        >
                          Daemon & JSON Logs
                        </label>
                        <span className="block truncate font-mono text-[9px] text-muted-foreground">
                          /var/log & container rings
                        </span>
                      </div>
                      <Switch
                        checked={clearLogs}
                        id="purge-logs-toggle"
                        onCheckedChange={setClearLogs}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-3 py-2">
                      <div className="min-w-0">
                        <label
                          className="block cursor-pointer truncate font-bold font-mono text-[11px] text-foreground"
                          htmlFor="purge-deps-toggle"
                        >
                          Dependency Store
                        </label>
                        <span className="block truncate font-mono text-[9px] text-muted-foreground">
                          pnpm store & node_modules
                        </span>
                      </div>
                      <Switch
                        checked={clearDeps}
                        id="purge-deps-toggle"
                        onCheckedChange={setClearDeps}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-3 py-2">
                      <div className="min-w-0">
                        <label
                          className="block cursor-pointer truncate font-bold font-mono text-[11px] text-foreground"
                          htmlFor="purge-temp-toggle"
                        >
                          Temp & IPC Sockets
                        </label>
                        <span className="block truncate font-mono text-[9px] text-muted-foreground">
                          /tmp/workstation & locks
                        </span>
                      </div>
                      <Switch
                        checked={clearTemp}
                        id="purge-temp-toggle"
                        onCheckedChange={setClearTemp}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Active Purge Execution Plan
                  </span>
                  <div className="divide-y divide-border/50 border border-border/60 bg-muted/5 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Build Cache (.next / .turbo)
                      </span>
                      <span className="text-emerald-500">ALWAYS PURGED</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Docker & Container Log Rings
                      </span>
                      <span
                        className={
                          clearDocker || clearLogs
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }
                      >
                        {[
                          clearDocker ? "DOCKER PRUNE" : null,
                          clearLogs ? "LOG TRUNCATE" : null,
                        ]
                          .filter(Boolean)
                          .join(" + ") || "SKIPPED"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Store & Temp Buffers
                      </span>
                      <span
                        className={
                          clearDeps || clearTemp
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {[
                          clearDeps ? "PNPM STORE" : null,
                          clearTemp ? "/TMP SWEEP" : null,
                        ]
                          .filter(Boolean)
                          .join(" + ") || "SKIPPED"}
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

      {/* Row 2: Balanced 6/6 CAD Grid — Live Cache Footprint Dump + Maintenance Execution Output */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            <CadCell
              bodyClassName="p-0"
              className="md:col-span-6"
              footerLeft="Filesystem, Docker layers & log ring report"
              footerRight="GET /api/cache"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchCache}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Refresh ↻
                </Button>
              }
              index="M-03"
              title="Live Storage, Docker & Log Breakdown"
            >
              <VerbatimOutput
                className="min-h-[220px] border-0 shadow-none"
                label="GET /api/cache"
                output={cacheStatus}
              />
            </CadCell>

            <CadCell
              bodyClassName="p-0"
              className="md:col-span-6"
              footerLeft="Standard output from maintenance runner"
              footerRight="EXECUTION LOG"
              headerAction={
                actionOutput ? (
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    onClick={() => setActionOutput(null)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                ) : null
              }
              index="M-04"
              title="Maintenance Execution Output"
            >
              <VerbatimOutput
                className="min-h-[220px] border-0 shadow-none"
                label="POST /api/system/* | /api/cache/clear"
                output={
                  actionOutput ??
                  "Ready. Trigger a system diagnostic audit, Docker prune, log rotation, or cache cleanup above to inspect execution output."
                }
              />
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
    </div>
  );
}
