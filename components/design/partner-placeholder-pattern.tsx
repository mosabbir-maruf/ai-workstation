"use client";

import { useId } from "react";

export function PartnerPlaceholderPattern({
  reversed = false,
  className = "pointer-events-none absolute inset-0 z-0 h-full w-full",
}: {
  reversed?: boolean;
  className?: string;
}) {
  const uniqueId = useId();
  const patternId = `diagonal-pattern-${uniqueId.replace(/:/g, "")}`;
  const pathData = reversed
    ? "M 0,0 l 8,8 M -2,6 l 4,4 M 6,-2 l 4,4"
    : "M 0,8 l 8,-8 M -2,2 l 4,-4 M 6,10 l 4,-4";

  return (
    <svg
      aria-hidden
      className={className}
      preserveAspectRatio="none"
    >
      <title>Diagonal grid pattern</title>
      <defs>
        <pattern
          height={8}
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={8}
        >
          <path
            d={pathData}
            shapeRendering="auto"
            stroke="var(--border)"
            strokeLinecap="square"
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect fill={`url(#${patternId})`} height="100%" width="100%" />
    </svg>
  );
}
