"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSseStream } from "@/lib/workstation/sse-client";

interface SseLogViewerProps {
  endpoint: string;
  title: string;
  autoConnect?: boolean;
  maxLines?: number;
  className?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

function getStatusDotClass(isEnded: boolean, connected: boolean) {
  if (isEnded) {
    return "bg-muted-foreground/60";
  }
  if (connected) {
    return "animate-pulse bg-emerald-500";
  }
  return "bg-amber-500";
}

function getStatusBadge(isEnded: boolean, connected: boolean) {
  if (isEnded) {
    return "ENDED";
  }
  if (connected) {
    return "LIVE";
  }
  return "IDLE";
}

const LEADING_CODE_REGEX = /^(\[[A-Z0-9-]+\])\s*(.*)$/;

function parseCodeAndTitle(rawTitle: string): {
  code: string | null;
  cleanTitle: string;
} {
  const match = rawTitle.match(LEADING_CODE_REGEX);
  if (match) {
    return {
      code: match[1] ?? null,
      cleanTitle: match[2] || rawTitle,
    };
  }
  return { code: null, cleanTitle: rawTitle };
}

export function SseLogViewer({
  endpoint,
  title,
  autoConnect = true,
  maxLines = 1000,
  className,
  action,
  compact = false,
}: SseLogViewerProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { logs, connected, isEnded, startStream, stopStream, clearLogs } =
    useSseStream(endpoint, { autoConnect, maxLines });

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs.length, autoScroll]);

  const rawLogText = useMemo(() => logs.join("\n"), [logs]);
  const { code, cleanTitle } = useMemo(() => parseCodeAndTitle(title), [title]);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border border-border bg-white text-card-foreground dark:bg-black",
        className
      )}
    >
      {/* CAD Header bar */}
      <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {code ? (
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
              {code}
            </span>
          ) : null}
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              getStatusDotClass(isEnded, connected)
            )}
          />
          <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
            {cleanTitle}
          </h4>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {!compact && (
            <Button
              className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
              onClick={() => setAutoScroll((v) => !v)}
              size="xs"
              variant="ghost"
            >
              Scroll: {autoScroll ? "ON" : "OFF"}
            </Button>
          )}

          {connected ? (
            <Button
              className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
              onClick={stopStream}
              size="xs"
              variant="outline"
            >
              Pause
            </Button>
          ) : (
            <Button
              className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
              onClick={startStream}
              size="xs"
              variant="outline"
            >
              {isEnded ? "Replay" : "Connect"}
            </Button>
          )}

          <Button
            className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
            onClick={clearLogs}
            size="xs"
            variant="ghost"
          >
            Clear
          </Button>

          <CopyButton
            aria-label="Copy logs"
            className="h-6 w-6 rounded-none border border-border/60"
            text={rawLogText}
          />

          {action}
        </div>
      </div>

      {/* Terminal log content */}
      <div
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain p-4 font-mono text-xs leading-relaxed",
          compact
            ? "max-h-[260px] min-h-[210px]"
            : "max-h-[380px] min-h-[220px]"
        )}
        ref={containerRef}
      >
        <div className="flex h-full min-h-[176px] flex-col justify-between border border-border/70 bg-muted/15 p-3">
          {logs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center">
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    getStatusDotClass(isEnded, connected)
                  )}
                />
                <span>
                  {connected
                    ? "Connected to SSE stream — awaiting stdout frames..."
                    : "Stream idle — waiting for incoming log output..."}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground/50">
                Buffer capacity: {maxLines} lines · Source: {endpoint}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((line, idx) => (
                <div
                  className="flex select-text items-start gap-3 px-1 py-0.5 hover:bg-muted/30"
                  key={idx}
                >
                  <span className="w-6 shrink-0 select-none text-right font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all font-mono text-foreground/90 text-xs">
                    {line}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CAD Terminal status bar */}
      <div className="flex h-9 items-center justify-between border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
        <span>
          SSE Stream · {endpoint} ({getStatusBadge(isEnded, connected)})
        </span>
        <span>
          {logs.length} / {maxLines} lines
        </span>
      </div>
    </div>
  );
}
