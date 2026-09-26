"use client";

import { PatternLines } from "@aiws/ui/charts";
import { useId } from "react";

export function PartnerPlaceholderPattern({
  reversed = false,
}: {
  reversed?: boolean;
}) {
  const uniqueId = useId();
  const patternId = `partner-placeholder-${uniqueId.replace(/:/g, "")}`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      preserveAspectRatio="none"
    >
      <title>Partner placeholder pattern</title>
      <defs>
        <PatternLines
          height={8}
          id={patternId}
          orientation={reversed ? ["diagonalRightToLeft"] : ["diagonal"]}
          stroke="var(--border)"
          strokeWidth={1}
          width={8}
        />
      </defs>
      <rect fill={`url(#${patternId})`} height="100%" width="100%" />
    </svg>
  );
}
