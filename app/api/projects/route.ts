import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/projects", () => {
    return NextResponse.json(
      {
        ok: false,
        projects: [],
        raw: "Backend service unreachable. Check NEXT_PUBLIC_API_URL or WORKSTATION_BACKEND_URL.",
        output: "Backend service unreachable.",
      },
      { status: 503 }
    );
  });
}
