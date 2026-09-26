"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  type Workflow,
  workflowCollapsedCount,
  workflows,
} from "@/lib/workflows";
import { GridCornerDots } from "./line-grid";
import { DesignWorkflowPanel } from "./workflow-panel";

const columnsPerRow = 3;

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function WorkflowPanelContent({ workflow }: { workflow: Workflow }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-border/50 border-b pb-3">
        <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          {workflow.category}
        </span>
        <span className="font-medium text-foreground text-xs">
          {workflow.title}
        </span>
      </div>

      <div className="group relative flex items-center justify-between gap-2 rounded border border-border/60 bg-muted/40 px-2.5 py-1.5 font-mono text-foreground text-xs">
        <span className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span className="select-none text-muted-foreground/60">$</span>
          <span className="truncate">{workflow.command}</span>
        </span>
        <CopyButton
          aria-label={`Copy ${workflow.command}`}
          className="size-6 shrink-0 opacity-70 transition-opacity hover:opacity-100"
          text={workflow.command}
        />
      </div>

      <p className="text-left text-muted-foreground text-sm leading-relaxed">
        {workflow.content.split(/(`[^`]+`)/g).map((part, index) => {
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[13px] text-foreground"
                // biome-ignore lint/suspicious/noArrayIndexKey: pure inline text parts
                key={index}
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        })}
      </p>
    </div>
  );
}

export function HomeWorkflowsGrid({
  items = workflows,
  collapsedCount = workflowCollapsedCount,
}: {
  items?: Workflow[];
  collapsedCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > collapsedCount;
  const visibleItems = expanded ? items : items.slice(0, collapsedCount);
  const itemRows = chunkItems(visibleItems, columnsPerRow);

  return (
    <section aria-label="Developer workflows" className="w-full">
      <div className="relative flex w-full flex-col overflow-visible border-border border-t border-l">
        {itemRows.map((rowItems) => (
          <div
            className="relative w-full overflow-visible"
            key={rowItems.map((item) => item.id).join("-")}
          >
            <div className="grid grid-cols-1 overflow-visible md:grid-cols-3">
              {rowItems.map((workflow) => (
                <DesignWorkflowPanel
                  className="min-w-0"
                  key={workflow.id}
                  showMobileCornerDots
                >
                  <WorkflowPanelContent workflow={workflow} />
                </DesignWorkflowPanel>
              ))}
            </div>
            <GridCornerDots
              className="z-3 hidden md:block"
              columns={rowItems.length}
              rows={1}
            />
          </div>
        ))}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          data-grid-rulers
        >
          <div className="absolute -top-8 left-0 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute top-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
          <div className="absolute -top-8 right-0 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute top-0 -right-8 block h-px w-10 bg-muted-foreground/40" />

          <div className="absolute -bottom-8 left-0 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute bottom-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
          <div className="absolute right-0 -bottom-8 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute -right-8 bottom-0 block h-px w-10 bg-muted-foreground/40" />

          <div className="absolute -top-8 -right-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
          <div className="absolute -bottom-8 -left-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
        </div>
      </div>

      {hasMore ? (
        <div className="flex justify-center py-8">
          <Button
            onClick={() => setExpanded((value) => !value)}
            size="lg"
            type="button"
            variant="outline"
          >
            {expanded ? "Show less" : "See more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
