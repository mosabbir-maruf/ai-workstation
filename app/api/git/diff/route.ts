import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

const FALLBACK_DIFF_PAYLOAD = {
  ok: true,
  clean: true,
  project: "none",
  path: "",
  filesCount: 0,
  files: [],
  stat: "",
  diff: "",
  output: "Host workstation daemon not reached.",
};

const createFallbackResponse = () => NextResponse.json(FALLBACK_DIFF_PAYLOAD);

async function handleGitDiffRequest(request: Request) {
  const res = await proxyOrRespond(request, "/api/git/diff", createFallbackResponse);
  if (res.status === 404) {
    try {
      const cloned = res.clone();
      const body = await cloned.json();
      if (body?.output && typeof body.output === "string" && body.output.includes("Endpoint not found")) {
        return NextResponse.json({
          ...FALLBACK_DIFF_PAYLOAD,
          ok: false,
          needsDaemonRestart: true,
          output: "Host daemon endpoint /api/git/diff not loaded. The running host daemon instance on the server must be restarted to register the new endpoint: run 'aiws daemon restart' or 'sudo systemctl restart aiws-daemon'.",
        });
      }
    } catch {
      // Fall through to original response
    }
  }
  return res;
}

export async function GET(request: Request) {
  return await handleGitDiffRequest(request);
}

export async function POST(request: Request) {
  return await handleGitDiffRequest(request);
}
