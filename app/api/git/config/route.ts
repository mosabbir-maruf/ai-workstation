import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  const res = await proxyOrRespond(request, "/api/git/config", () => {
    return NextResponse.json(
      {
        ok: false,
        name: "",
        email: "",
        isConfigured: false,
        output: "Workstation daemon is unreachable.",
      },
      { status: 503 }
    );
  });

  // Seamless fallback for older daemon versions that haven't been restarted yet
  if (res.status === 404) {
    try {
      const fallbackReq = new Request(
        request.url.replace("/api/git/config", "/api/terminal/exec"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command:
              "bash -c 'echo \"NAME:$(git config user.name)\"; echo \"EMAIL:$(git config user.email)\"'",
            target: "host",
          }),
          signal: request.signal,
        }
      );

      const termRes = await proxyOrRespond(fallbackReq, "/api/terminal/exec", () =>
        NextResponse.json({ ok: false, output: "Host daemon unreachable." })
      );

      if (termRes.ok) {
        const body = await termRes.json();
        const lines: string[] = (body?.output || "").split("\n");
        let name = "";
        let email = "";
        for (const line of lines) {
          if (line.startsWith("NAME:")) name = line.slice(5).trim();
          if (line.startsWith("EMAIL:")) email = line.slice(6).trim();
        }
        const isInvalid =
          !email ||
          !email.includes("@") ||
          email.endsWith(".internal.cloudapp.net") ||
          email.endsWith(".local") ||
          email.includes("@localhost");

        return NextResponse.json({
          ok: true,
          name,
          email,
          isConfigured: !isInvalid && Boolean(name),
        });
      }
    } catch {
      // Fall through to original response
    }
  }

  return res;
}

export async function POST(request: Request) {
  let bodyJson: { name?: string; email?: string } | null = null;
  let bodyText = "";
  try {
    bodyText = await request.text();
    if (bodyText) {
      bodyJson = JSON.parse(bodyText);
    }
  } catch {
    // Non-JSON payload
  }

  const initialReq = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: bodyText,
    signal: request.signal,
  });

  const res = await proxyOrRespond(initialReq, "/api/git/config", () =>
    NextResponse.json(
      {
        ok: false,
        output: "Workstation daemon is unreachable.",
      },
      { status: 503 }
    )
  );

  // Seamless fallback for older daemon versions that haven't been restarted yet
  if (res.status === 404 && bodyJson?.name && bodyJson?.email) {
    try {
      const name = bodyJson.name.trim();
      const email = bodyJson.email.trim();

      const fallbackReq = new Request(
        request.url.replace("/api/git/config", "/api/terminal/exec"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: `git config --global user.name "${name}" && git config --global user.email "${email}"`,
            target: "host",
          }),
          signal: request.signal,
        }
      );

      const termRes = await proxyOrRespond(fallbackReq, "/api/terminal/exec", () =>
        NextResponse.json({ ok: false, output: "Host daemon unreachable." })
      );

      if (termRes.ok) {
        return NextResponse.json({
          ok: true,
          name,
          email,
          isConfigured: true,
          output: "Git author credentials configured successfully.",
        });
      }
    } catch {
      // Fall through to original response
    }
  }

  return res;
}
