"use client";

import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
  theme?: "light" | "dark";
  variant?: "default" | "blended";
}

function getFillColor(theme?: "light" | "dark") {
  if (theme === "light") {
    return "text-black fill-black";
  }
  if (theme === "dark") {
    return "text-white fill-white";
  }
  return "text-foreground fill-current";
}

export function AiwsLogo({
  className,
  size = 16,
  theme,
  variant: _variant,
}: IconProps) {
  const fillColor = getFillColor(theme);

  return (
    <div
      className={cn(
        "relative flex aspect-square shrink-0 items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        className={cn("h-full w-full", fillColor)}
        fill="currentColor"
        viewBox="0 0 357 357"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Ai Workstation Logo</title>
        <path
          d="M274.505 276.262L356.349 273.218L264.425 177.452L356.35 81.6857L274.509 78.6382L265.227 0L179.66 89.1437L94.0922 0L84.8099 78.6382L2.96948 81.6857L94.8939 177.452L2.96955 273.218L84.8141 276.262L94.0923 354.904L179.66 265.761L265.227 354.904L274.505 276.262Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
