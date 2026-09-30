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

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/git/diff", createFallbackResponse);
}

export async function POST(request: Request) {
  return await proxyOrRespond(request, "/api/git/diff", createFallbackResponse);
}
