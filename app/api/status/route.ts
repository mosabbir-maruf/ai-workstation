import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/status", () => {
    return NextResponse.json(
      {
        ok: false,
        output:
          "AI Workstation backend is offline or unreachable. Ensure the workstation daemon is running and NEXT_PUBLIC_API_URL or WORKSTATION_BACKEND_URL is configured.",
      },
      { status: 503 }
    );
  });
}
