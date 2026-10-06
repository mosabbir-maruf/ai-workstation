const ESC = String.fromCharCode(27);
const CSI = String.fromCharCode(155);

// Pre-compiled once at module evaluation to prevent garbage collection and recompilation overhead
const ANSI_REGEX = new RegExp(
  "[" + ESC + CSI + "][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
  "g"
);
const ORPHANED_COLOR_REGEX = /\[(?:\d{1,3}(?:;\d{1,3})*)?m/g;
const ORPHANED_CSI_REGEX = /\[[\d;]*[A-HJKSTfhilnr]/g;

/**
 * Strips ANSI escape sequences from terminal output.
 *
 * Handles both standard sequences (with ESC prefix) and orphaned bracket
 * codes where the ESC character was already consumed during HTTP transport.
 */
export function stripAnsi(text: string): string {
  if (!text) return "";
  // Fast path: bypass regex parsing entirely if text contains no escape or bracket markers
  if (!text.includes(ESC) && !text.includes(CSI) && !text.includes("[")) {
    return text;
  }
  return text
    .replace(ANSI_REGEX, "")
    .replace(ORPHANED_COLOR_REGEX, "")
    .replace(ORPHANED_CSI_REGEX, "");
}
