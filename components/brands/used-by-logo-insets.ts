import type { CSSProperties } from "react";

/** Pixel padding on all sides, or horizontal / vertical overrides. */
export type UsedByLogoPadding = number | { x: number; y: number };

/** Default padding (px) for every logo inset container. */
export const defaultUsedByLogoPadding: UsedByLogoPadding = 4;

/**
 * Per-logo inset padding overrides. Keys match `UsedByLogo.id`.
 * Tune these to visually align wordmarks inside the shared aspect-ratio cell.
 */
export const usedByLogoPadding: Partial<Record<string, UsedByLogoPadding>> = {
  linux: { x: 4, y: 0 },
  docker: { x: 4, y: 0 },
  deepseek: { x: 2, y: 0 },
  harness: { x: 4, y: 0 },
  cloudflare: { x: 2, y: 0 },
  github: { x: 4, y: 0 },
  script: { x: 4, y: 0 },
  nextjs: { x: 4, y: 0 },
};

export function getUsedByLogoPaddingStyle(id: string): CSSProperties {
  const value = usedByLogoPadding[id] ?? defaultUsedByLogoPadding;

  if (typeof value === "number") {
    return { padding: value };
  }

  return {
    paddingBlock: value.y,
    paddingInline: value.x,
  };
}
