"use client";

import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

export function PreviewSection() {
  const [previewData, setPreviewData] = useState<{
    text?: string;
    anywhereApp?: string;
    anywhereDsh?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewportMode, setViewportMode] = useState<"app" | "dsh">("app");
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [currentOrigin, setCurrentOrigin] = useState<string>("Same-origin endpoint");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getPreview();
      if (res && (res.ok || res.anywhereApp || res.anywhereDsh || res.text)) {
        setPreviewData({
          text: res.text,
          anywhereApp: res.anywhereApp,
          anywhereDsh: res.anywhereDsh,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const appUrl = previewData?.anywhereApp || "";
  const dshUrl = previewData?.anywhereDsh || "";
  const activeViewportUrl = viewportMode === "app" ? appUrl : dshUrl;

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: [V-01] Anywhere App Edge + [V-02] Anywhere DSH Harness */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [V-01] Anywhere App Edge Endpoint */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="Ingress · Cloudflare Zero Trust Edge"
              footerRight="TLS 1.3 Verified"
              headerAction={
                <>
                  <CopyButton
                    aria-label="Copy App Edge URL"
                    className="h-6 w-6 rounded-none border border-border/60"
                    text={appUrl}
                  />
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    nativeButton={false}
                    render={
                      <a
                        href={appUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open App ↗
                      </a>
                    }
                    size="xs"
                    variant="default"
                  />
                </>
              }
              index="V-01"
              title="Anywhere App Edge Endpoint"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Ingress Tunnel Specification
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
                      Origin Socket
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        TLS 1.3
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Edge Cipher
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        HTTP/3
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Transport
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-border/50 border-t pt-4">
                <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Routed Application Endpoints
                </div>
                {[
                  { label: "Public Edge URL", url: appUrl || "Not configured" },
                  {
                    label: "Current Origin",
                    url: currentOrigin,
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
                      <div
                        className="mt-0.5 truncate font-mono text-foreground text-xs"
                        suppressHydrationWarning
                      >
                        {item.url}
                      </div>
                    </div>
                    <CopyButton
                      aria-label={`Copy ${item.label}`}
                      className="h-7 w-7 shrink-0 rounded-none border border-border/60"
                      text={item.url}
                    />
                  </div>
                ))}
              </div>
            </CadCell>

            {/* [V-02] Anywhere DSH Harness Endpoint */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="Ingress · Agent RPC Bridge"
              footerRight="Port 8080 Bound"
              headerAction={
                <>
                  <CopyButton
                    aria-label="Copy DSH Edge URL"
                    className="h-6 w-6 rounded-none border border-border/60"
                    text={dshUrl}
                  />
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    nativeButton={false}
                    render={
                      <a
                        href={dshUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open DSH ↗
                      </a>
                    }
                    size="xs"
                    variant="outline"
                  />
                </>
              }
              index="V-02"
              title="Anywhere DSH Harness Endpoint"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Agent Bridge Specification
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold font-mono text-foreground text-sm tabular-nums">
                        :8080
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Bridge Socket
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        JSON-RPC
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Wire Protocol
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        Sandbox
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Execution Mode
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-border/50 border-t pt-4">
                <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Routed Harness Endpoints
                </div>
                {[
                  { label: "Public DSH Gateway", url: dshUrl || "Not configured" },
                  { label: "Internal RPC Bridge", url: "Port 8080 (internal container proxy)" },
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
                        {item.url}
                      </div>
                    </div>
                    <CopyButton
                      aria-label={`Copy ${item.label}`}
                      className="h-7 w-7 shrink-0 rounded-none border border-border/60"
                      text={item.url}
                    />
                  </div>
                ))}
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

      {/* Row 2: [V-03] Live Embedded Web Preview Viewport */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <CadCell
            bodyClassName="p-0 overflow-hidden"
            footerLeft={
              activeViewportUrl
                ? `Viewport · ${viewportMode === "app" ? "Application" : "DSH Harness"} (${activeViewportUrl})`
                : "Viewport · Ingress Endpoint Offline"
            }
            footerRight="If target blocks iframe embedding, click Open ↗"
            headerAction={
              <>
                <Button
                  className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                  onClick={() => setViewportMode("app")}
                  size="xs"
                  variant={viewportMode === "app" ? "default" : "ghost"}
                >
                  App Preview
                </Button>
                <Button
                  className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                  onClick={() => setViewportMode("dsh")}
                  size="xs"
                  variant={viewportMode === "dsh" ? "default" : "ghost"}
                >
                  DSH Harness
                </Button>
                {activeViewportUrl && (
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    nativeButton={false}
                    render={
                      <a
                        href={activeViewportUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open ↗
                      </a>
                    }
                    size="xs"
                    variant="ghost"
                  />
                )}
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={() => {
                    setIframeKey((k) => k + 1);
                    fetchPreview();
                  }}
                  size="xs"
                  variant="outline"
                >
                  Reload ↻
                </Button>
              </>
            }
            index="V-03"
            title="Local Runtime Web Viewport"
          >
            {/* Mini CAD URL & Ingress Bar */}
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/20 px-3.5 py-1.5 font-mono text-[11px]">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${activeViewportUrl ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                <span className="shrink-0 text-muted-foreground/60 uppercase text-[9px] tracking-widest">
                  {viewportMode === "app" ? "Target: App" : "Target: DSH"}
                </span>
                <span
                  className="truncate font-mono text-foreground text-xs"
                  suppressHydrationWarning
                >
                  {activeViewportUrl || "Endpoint not configured / offline"}
                </span>
              </div>
              {activeViewportUrl && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <CopyButton
                    aria-label="Copy Active Target URL"
                    className="h-6 w-6 rounded-none border border-border/60"
                    text={activeViewportUrl}
                  />
                </div>
              )}
            </div>

            <div className="relative aspect-16/9 min-h-[420px] w-full bg-background">
              {activeViewportUrl ? (
                <iframe
                  className="size-full border-0 bg-background"
                  key={`${activeViewportUrl}-${iframeKey}`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  src={activeViewportUrl}
                  title={
                    viewportMode === "app"
                      ? "Workstation Application Preview"
                      : "DeepSeek Harness Preview"
                  }
                />
              ) : (
                <div className="flex size-full min-h-[420px] flex-col items-center justify-center space-y-3 bg-muted/10 p-8 text-center font-mono">
                  <span className="size-2 rounded-full bg-amber-500/60" />
                  <div className="text-foreground text-xs font-semibold uppercase tracking-widest">
                    {viewportMode === "app"
                      ? "No Application Endpoint Configured"
                      : "No DSH Harness Endpoint Configured"}
                  </div>
                  <p className="max-w-md text-xs text-muted-foreground">
                    {viewportMode === "app"
                      ? "Ensure your application is running (ai run) and Cloudflare Tunnel is configured with CLOUDFLARED_APP_HOSTNAME."
                      : "Ensure DeepSeek Harness is running (ai harness start) and Cloudflare Tunnel is configured with CLOUDFLARED_DSH_HOSTNAME."}
                  </p>
                  <Button
                    className="h-6 rounded-none px-3 font-mono text-[10px] uppercase tracking-wider"
                    onClick={fetchPreview}
                    size="xs"
                    variant="outline"
                  >
                    Check Status ↻
                  </Button>
                </div>
              )}
            </div>
          </CadCell>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={1}
            rows={1}
          />
        </div>
      </CadGridFrame>

      {previewData?.text && (
        <CadGridFrame showRulers>
          <div className="relative w-full overflow-visible">
            <CadCell
              footerLeft="GET /api/preview [text]"
              footerRight="Ingress Routing Manifest"
              index="V-04"
              title="Preview Ingress Manifest"
            >
              <VerbatimOutput
                label="GET /api/preview [text]"
                output={previewData.text}
              />
            </CadCell>
            <GridCornerDots
              className="z-3 hidden md:block"
              columns={1}
              rows={1}
            />
          </div>
        </CadGridFrame>
      )}
    </div>
  );
}
