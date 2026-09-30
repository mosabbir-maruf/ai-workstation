import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function POST(request: Request) {
  let bodyJson: { command?: string } | null = null;
  let bodyText = "";
  try {
    bodyText = await request.text();
    if (bodyText) {
      bodyJson = JSON.parse(bodyText);
    }
  } catch {
    // Non-JSON or empty payload
  }

  const initialReq = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: bodyText,
    signal: request.signal,
  });

  const res = await proxyOrRespond(initialReq, "/api/git/exec", () =>
    NextResponse.json(
      {
        ok: false,
        output:
          "Workstation daemon is unreachable. Verify connection to the remote host.",
      },
      { status: 503 }
    )
  );

  // Seamless fallback for older daemon versions that haven't been restarted yet
  if (res.status === 404 && bodyJson?.command) {
    try {
      const rawCommand = bodyJson.command.trim();
      const cleanCmd = rawCommand.startsWith("git ")
        ? rawCommand.slice(4).trim()
        : rawCommand;

      const fallbackTerminalPayload = {
        command: `bash -c 'source ~/.bashrc 2>/dev/null; if [ -n "$ACTIVE_PROJECT_PATH" ]; then cd "$ACTIVE_PROJECT_PATH"; else cd /workspace/projects/* 2>/dev/null || true; fi; git ${cleanCmd}'`,
        target: "host",
      };

      const fallbackReq = new Request(
        request.url.replace("/api/git/exec", "/api/terminal/exec"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackTerminalPayload),
          signal: request.signal,
        }
      );

      return await proxyOrRespond(fallbackReq, "/api/terminal/exec", () =>
        NextResponse.json({
          ok: false,
          output: "Host daemon endpoint not reachable.",
        })
      );
    } catch {
      // Fall through to original response
    }
  }

  return res;
}
