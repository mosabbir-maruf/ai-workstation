"use client";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

interface VerbatimOutputProps {
  output?: string | null;
  ok?: boolean;
  label?: string;
  emptyText?: string;
  className?: string;
}

export function VerbatimOutput({
  output,
  ok = true,
  label = "Backend Output",
  emptyText = "No output recorded yet. Run an action to inspect results.",
  className,
}: VerbatimOutputProps) {
  if (!output) {
    return (
      <div
        className={cn(
          className,
          "flex min-h-[140px] flex-1 items-center justify-center border border-border/70 border-dashed bg-muted/10 p-4 text-center font-mono text-muted-foreground/60 text-xs"
        )}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={cn(
        className,
        "relative flex flex-1 flex-col border border-border/70 bg-muted/15 text-card-foreground shadow-none"
      )}
    >
      <div className="flex items-center justify-between border-border/60 border-b bg-muted/20 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              ok ? "bg-emerald-500" : "bg-destructive"
            )}
          />
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {label}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {ok ? "200 OK" : "ERR"}
          </span>
        </div>
        <CopyButton
          aria-label="Copy output"
          className="h-6 w-6 shrink-0 rounded-none border border-border/60"
          text={output}
        />
      </div>

      <pre className="max-h-[260px] min-h-[120px] flex-1 select-text overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all p-3 font-mono text-foreground text-xs leading-relaxed">
        {output}
      </pre>
    </div>
  );
}
