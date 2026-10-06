/**
 * Strips ANSI escape sequences from terminal output.
 *
 * Handles both standard sequences (with ESC prefix) and orphaned bracket
 * codes where the ESC character was already consumed during HTTP transport.
 */
export function stripAnsi(text: string): string {
  const esc = String.fromCharCode(27);
  const csi = String.fromCharCode(155);
  const ansiRegex = new RegExp(
    "[" + esc + csi + "][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]",
    "g"
  );
  return text
    .replace(ansiRegex, "")
    .replace(/\[(?:\d{1,3}(?:;\d{1,3})*)?m/g, "")
    .replace(/\[[\d;]*[A-HJKSTfhilnr]/g, "");
}
