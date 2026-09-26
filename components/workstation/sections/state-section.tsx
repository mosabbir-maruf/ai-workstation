"use client";

import { useRef, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

const SNAPSHOT_PATHS = [
  {
    id: "dsh-config",
    label: "DSH Provider Keystore & Quotas",
    path: "/etc/dsh/config.json",
    mode: "AES-256 / 0600",
  },
  {
    id: "github-app",
    label: "GitHub App PEM & Installation Vault",
    path: "/etc/workstation/github-app.json",
    mode: "PKCS#8 / 0600",
  },
  {
    id: "tunnel-env",
    label: "Cloudflare Edge Connector & Port Map",
    path: "/etc/workstation/tunnel.env",
    mode: "ENV / 0640",
  },
  {
    id: "operator-notes",
    label: "Operator Runbook & Workspace State",
    path: "/var/lib/workstation/state.json",
    mode: "JSON / 0644",
  },
] as const;

export function StateSection() {
  const [exportResult, setExportResult] = useState<{
    filename: string;
    downloadUrl: string;
  } | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await workstationApi.exportState();
      if (res.ok) {
        setExportResult({
          filename: res.filename,
          downloadUrl: res.downloadUrl,
        });
        setActionOutput(
          `[POST /api/state/export]\nState snapshot created successfully: ${res.filename}\nDownload URL: ${res.downloadUrl}`
        );
      }
    } catch (err) {
      setActionOutput(`State export failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedFile) {
      return;
    }

    try {
      setLoading(true);
      const res = await workstationApi.importState(selectedFile);
      setActionOutput(
        `[POST /api/state/import · ${selectedFile.name}]\n${res.output}`
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setActionOutput(`State import failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: Balanced 6/6 CAD Grid — State Export + State Import */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [ST-01] Export Workstation Snapshot */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Pack workstation state into portable archive"
              footerRight="POST /api/state/export"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={handleExport}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  {loading ? "Packing..." : "Export Snapshot ↑"}
                </Button>
              }
              index="ST-01"
              title="Export Workstation Snapshot"
            >
              {/* Top: 3-Column Snapshot Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Snapshot Archive Specification
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    application/gzip
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Archive Format
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      TAR.GZ / GZIP
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Artifact State
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          exportResult
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]"
                            : "bg-amber-500"
                        )}
                      />
                      <span className="truncate font-bold font-mono text-foreground text-xs">
                        {exportResult ? "PACKED" : "STANDBY"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Vault Scope
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-emerald-500 text-xs">
                      FULL STATE
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Export Trigger + Artifact Download Slot + Checkpoints */}
              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="space-y-1.5">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Snapshot Generation & Download
                  </span>
                  <div className="flex items-center justify-between gap-2 border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="min-w-0">
                      <span className="block truncate font-bold font-mono text-foreground text-xs">
                        {exportResult
                          ? exportResult.filename
                          : "No snapshot generated in active session"}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        {exportResult
                          ? "Ready via GET /api/state/download"
                          : "Click Generate Archive to build a portable .tar.gz bundle"}
                      </span>
                    </div>
                    {exportResult ? (
                      <Button
                        className="h-7 shrink-0 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                        nativeButton={false}
                        render={
                          <a
                            download={exportResult.filename}
                            href={exportResult.downloadUrl}
                          >
                            Download ↓
                          </a>
                        }
                        size="sm"
                        variant="default"
                      />
                    ) : (
                      <Button
                        className="h-7 shrink-0 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                        disabled={loading}
                        onClick={handleExport}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Generate Archive
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Bundled Configuration Subsystems
                  </span>
                  <div className="divide-y divide-border/50 border border-border/60 bg-muted/5 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Environment & Port Bindings
                      </span>
                      <span className="text-foreground">INCLUDED</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        DSH & GitHub App Keystores
                      </span>
                      <span className="text-foreground">INCLUDED</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Operator Notes & Active Mount
                      </span>
                      <span className="text-emerald-500">VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>
            </CadCell>

            {/* [ST-02] Import & Restore Workstation State */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Restore environment state from .tar.gz snapshot"
              footerRight="POST /api/state/import"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading || !selectedFile}
                    onClick={handleClearSelection}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading || !selectedFile}
                    onClick={() => handleImport()}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    Restore State ↓
                  </Button>
                </>
              }
              index="ST-02"
              title="Import & Restore Workstation State"
            >
              {/* Top: 3-Column Restore Staging Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Restore Staging Telemetry
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    multipart/form-data
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Staged Archive
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          selectedFile
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]"
                            : "bg-amber-500"
                        )}
                      />
                      <span className="truncate font-bold font-mono text-foreground text-xs">
                        {selectedFile ? "STAGED" : "EMPTY"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Archive Size
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : "0.0 KB"}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Write Policy
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-amber-500 text-xs">
                      OVERWRITE
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Multipart Archive Selector + Restore Safety Protocol */}
              <form
                className="space-y-3 border-border/50 border-t pt-4"
                onSubmit={handleImport}
              >
                <div className="space-y-1.5">
                  <label
                    className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                    htmlFor="state-file-input"
                  >
                    Select Snapshot Archive (.tar.gz / .tgz)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      accept=".tar.gz,.tgz,.gz"
                      className="block h-9 w-full cursor-pointer border border-border/60 bg-muted/10 px-2 py-1 font-mono text-muted-foreground text-xs file:mr-2.5 file:rounded-none file:border file:border-border file:bg-muted/30 file:px-2.5 file:py-0.5 file:font-mono file:text-[10px] file:text-foreground file:uppercase hover:file:bg-muted"
                      disabled={loading}
                      id="state-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                      }}
                      ref={fileInputRef}
                      type="file"
                    />
                    <Button
                      className="h-9 shrink-0 rounded-none px-3 font-mono text-xs uppercase tracking-wider"
                      disabled={loading || !selectedFile}
                      size="sm"
                      type="submit"
                      variant="destructive"
                    >
                      Apply Restore
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Restore Verification Protocol
                  </span>
                  <div className="divide-y divide-border/50 border border-border/60 bg-muted/5 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Archive Header & Gzip Check
                      </span>
                      <span className="text-foreground">STRICT TAR.GZ</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Keystore Atomic Replacement
                      </span>
                      <span className="text-amber-500">MUTATES VAULT</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-muted-foreground">
                        Post-Import Supervisor Sync
                      </span>
                      <span className="text-emerald-500">AUTO-RELOAD</span>
                    </div>
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

      {/* Row 2: Balanced 6/6 CAD Grid — Snapshot Filesystem Manifest + Operation Output */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [ST-03] Snapshot Filesystem Path Manifest */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Filesystem targets included in state archive"
              footerRight="TAR MANIFEST"
              index="ST-03"
              title="Snapshot Filesystem Path Manifest"
            >
              <div className="divide-y divide-border/60 border border-border/60 bg-muted/5">
                {SNAPSHOT_PATHS.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-bold font-mono text-foreground text-xs">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                        {item.path}
                      </span>
                    </div>
                    <span className="shrink-0 border border-border/60 bg-muted/15 px-2 py-0.5 font-mono text-[9px] text-emerald-500 uppercase tracking-wider">
                      {item.mode}
                    </span>
                  </div>
                ))}
              </div>
            </CadCell>

            {/* [ST-04] State Operation Output */}
            <CadCell
              bodyClassName="p-0"
              className="md:col-span-6"
              footerLeft="Snapshot archive export & restore telemetry"
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
              index="ST-04"
              title="State Operation Output"
            >
              <VerbatimOutput
                className="min-h-[210px] border-0 shadow-none"
                label="POST /api/state/export | /api/state/import"
                output={
                  actionOutput ??
                  "Ready. Export a workstation snapshot (.tar.gz) or stage an archive to restore runtime state."
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
