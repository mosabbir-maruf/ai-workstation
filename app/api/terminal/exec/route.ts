import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function POST(request: Request) {
  return await proxyOrRespond(request, "/api/terminal/exec", () => {
    return NextResponse.json(
      {
        ok: false,
        output:
          "Workstation daemon is unreachable. Verify connection to the remote host.",
      },
      { status: 503 }
    );
  });
}
