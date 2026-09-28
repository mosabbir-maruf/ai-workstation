import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/overview", () => {
    return NextResponse.json(
      {
        ok: false,
        output:
          "AI Workstation backend is offline or unreachable. Ensure the workstation daemon is running and WORKSTATION_BACKEND_URL or NEXT_PUBLIC_API_URL is configured.",
      },
      { status: 503 }
    );
  });
}
