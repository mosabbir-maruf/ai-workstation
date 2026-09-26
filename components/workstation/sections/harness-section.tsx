"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

const VERSION_TAG_REGEX = /v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/;
const HARNESS_OFFLINE_REGEX =
  /stopped|inactive|dead|not running|offline|error/i;
const HARNESS_ONLINE_REGEX = /running|active|online|listening|ok|pid/i;

const RELEASE_CHANNEL_PRESETS = [
  { label: "latest", value: "" },
  { label: "stable", value: "stable" },
  { label: "v1.5.0", value: "v1.5.0" },
  { label: "nightly", value: "nightly" },
] as const;

export function HarnessSection() {
  const [harnessStatus, setHarnessStatus] = useState<string | null>(null);
  const [dshVersion, setDshVersion] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [targetVersion, setTargetVersion] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [h, v] = await Promise.all([
        workstationApi
          .getHarnessStatus()
          .catch((err) => ({ ok: false, output: String(err) })),
        workstationApi
          .getDshVersion()
          .catch((err) => ({ ok: false, output: String(err) })),
      ]);
      setHarnessStatus(h.output);
      setDshVersion(v.output);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAction = async (
    label: string,
    fn: () => Promise<{ ok: boolean; output: string }>
  ) => {
    try {
      setLoading(true);
      const res = await fn();
      setActionOutput(`[${label}]\n${res.output}`);
      await fetchAll();
    } catch (err) {
      setActionOutput(`[${label}] Harness error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const versionArg = targetVersion.trim() || undefined;
      const res = await workstationApi.updateDsh(versionArg);
      setActionOutput(
        `[DSH Binary Upgrade → ${versionArg ?? "latest"}]\n${res.output}`
      );
      setTargetVersion("");
      await fetchAll();
    } catch (err) {
      setActionOutput(`Update error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const isHarnessOnline = useMemo(() => {
    if (!harnessStatus) {
      return false;
    }
    if (HARNESS_OFFLINE_REGEX.test(harnessStatus)) {
      return false;
    }
    return HARNESS_ONLINE_REGEX.test(harnessStatus);
  }, [harnessStatus]);

  const detectedVersion = useMemo(() => {
    if (!dshVersion) {
      return "PROBING...";
    }
    const match = dshVersion.match(VERSION_TAG_REGEX);
    if (match?.[0]) {
      return match[0].startsWith("v") ? match[0] : `v${match[0]}`;
    }
    const firstLine = dshVersion.trim().split("\n")[0]?.trim();
    return firstLine ? firstLine.slice(0, 18) : "INSTALLED";
  }, [dshVersion]);

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: Balanced 6/6 CAD Grid — Harness Runtime Supervisor + DSH Binary Manager */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [H-01] DeepSeek Harness Runtime */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Autonomous agent execution harness"
              footerRight="RPC PORT :8080"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchAll}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Refresh ↻
                </Button>
              }
              index="H-01"
              title="DeepSeek Harness Runtime"
            >
              {/* Top: 3-Column Harness Supervisor Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Supervisor Specification
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    dsh-harnessd
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Bridge State
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          isHarnessOnline
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]"
                            : "bg-amber-500"
                        )}
                      />
                      <span className="truncate font-bold font-mono text-foreground text-xs">
                        {isHarnessOnline ? "ONLINE" : "STANDBY"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      RPC Endpoint
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      Internal :8080
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Sandbox Mode
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-emerald-500 text-xs">
                      ISOLATED
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: Supervisor Lifecycle Triggers */}
              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="space-y-1.5">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Supervisor Lifecycle Triggers
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleAction(
                          "Start Harness",
                          workstationApi.harnessStart
                        )
                      }
                      size="sm"
                      type="button"
                      variant="default"
                    >
                      Start
                    </Button>
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleAction("Stop Harness", workstationApi.harnessStop)
                      }
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      Stop
                    </Button>
                    <Button
                      className="h-8 rounded-none font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      onClick={() =>
                        handleAction(
                          "Restart Bridge",
                          workstationApi.harnessRestart
                        )
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Restart
                    </Button>
                  </div>
                </div>

                {/* Bottom: Agentic Capabilities Matrix */}
                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Active Subsystem Channels
                  </span>
                  <div className="divide-y divide-border/50 border border-border/60 bg-muted/5 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Tool Execution Bridge
                      </span>
                      <span className="text-foreground">POSIX / PTY</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Workspace Mount Scope
                      </span>
                      <span className="text-foreground">/workspace (RW)</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Stream Multiplexer
                      </span>
                      <span className="text-emerald-500">SSE + JSON-RPC</span>
                    </div>
                  </div>
                </div>
              </div>
            </CadCell>

            {/* [H-02] DSH Binary Version & Upgrade */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="DSH binary package & release manager"
              footerRight="POST /api/dsh/update"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading || !targetVersion}
                    onClick={() => setTargetVersion("")}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Reset
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => handleUpdate()}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    Upgrade Binary ↑
                  </Button>
                </>
              }
              index="H-02"
              title="DSH Binary Version & Upgrade"
            >
              {/* Top: 3-Column Binary Build Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Binary Build Telemetry
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    /usr/local/bin/dsh
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Installed Build
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-emerald-500 text-xs">
                      {detectedVersion}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Target Channel
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {targetVersion.trim() || "LATEST"}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Target Arch
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      LINUX / POSIX
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Target Version Form + Installed Version Readout */}
              <form
                className="space-y-3 border-border/50 border-t pt-4"
                onSubmit={handleUpdate}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                      htmlFor="dsh-target-version"
                    >
                      Target Release Tag / Channel
                    </label>
                    <div className="flex items-center gap-1">
                      {RELEASE_CHANNEL_PRESETS.map((preset) => {
                        const active = targetVersion === preset.value;
                        return (
                          <button
                            className={cn(
                              "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors",
                              active
                                ? "border-foreground bg-foreground text-background"
                                : "border-border/60 bg-muted/10 text-muted-foreground hover:border-border hover:text-foreground"
                            )}
                            key={preset.label}
                            onClick={() => setTargetVersion(preset.value)}
                            type="button"
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 rounded-none font-mono text-xs"
                      disabled={loading}
                      id="dsh-target-version"
                      onChange={(e) => setTargetVersion(e.target.value)}
                      placeholder="Leave blank for latest stable or specify tag (e.g. v1.5.0)"
                      value={targetVersion}
                    />
                    <Button
                      className="h-8 shrink-0 rounded-none px-3 font-mono text-xs uppercase tracking-wider"
                      disabled={loading}
                      size="sm"
                      type="submit"
                      variant="outline"
                    >
                      Apply Tag
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Installed Binary Signature (GET /api/dsh/version)
                  </span>
                  <div className="border border-border/60 bg-muted/10 px-3 py-2 font-mono text-[11px] text-foreground leading-relaxed">
                    <p className="truncate">
                      {dshVersion?.trim() || "Querying DSH binary signature..."}
                    </p>
                  </div>
                </div>
              </form>
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

      {/* Row 2: Balanced 6/6 CAD Grid — Live Harness Diagnostics + Operation Execution Output */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            <CadCell
              bodyClassName="p-0"
              className="md:col-span-6"
              footerLeft="Live agent bridge state & process supervisor"
              footerRight="GET /api/harness/status"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchAll}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Refresh ↻
                </Button>
              }
              index="H-03"
              title="Harness Runtime Diagnostics"
            >
              <VerbatimOutput
                className="min-h-[220px] border-0 shadow-none"
                label="GET /api/harness/status"
                output={harnessStatus}
              />
            </CadCell>

            <CadCell
              bodyClassName="p-0"
              className="md:col-span-6"
              footerLeft="Last supervisor or binary upgrade response"
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
              index="H-04"
              title="Harness & DSH Operation Output"
            >
              <VerbatimOutput
                className="min-h-[220px] border-0 shadow-none"
                label="POST /api/harness/* | /api/dsh/update"
                output={
                  actionOutput ??
                  "Ready. Trigger a harness lifecycle action or DSH binary upgrade above to inspect execution output."
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
