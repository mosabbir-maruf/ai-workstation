import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/health", () => {
    return NextResponse.json(
      { ok: false, output: "Backend service unreachable." },
      { status: 503 }
    );
  });
}
