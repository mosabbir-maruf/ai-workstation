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
  const [viewportRoute, setViewportRoute] = useState<string>("/");
  const [iframeKey, setIframeKey] = useState<number>(0);

  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getPreview();
      if (res.ok) {
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
                    url:
                      typeof window !== "undefined"
                        ? window.location.origin
                        : "Same-origin endpoint",
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
            footerLeft={`Viewport · Interactive 16:9 Sandbox (${viewportRoute})`}
            footerRight="GET /api/preview"
            headerAction={
              <>
                {(["/", "/docs", "/faq", "/workstation"] as const).map(
                  (route) => (
                    <Button
                      className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                      key={route}
                      onClick={() => setViewportRoute(route)}
                      size="xs"
                      variant={viewportRoute === route ? "default" : "ghost"}
                    >
                      {route}
                    </Button>
                  )
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
            <div className="relative aspect-16/9 min-h-[420px] w-full bg-background">
              <iframe
                className="size-full border-0"
                key={`${viewportRoute}-${iframeKey}`}
                src={viewportRoute}
                title="Workstation Local App Preview"
              />
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
