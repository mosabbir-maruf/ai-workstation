import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/dsh-settings", () => {
    return NextResponse.json(
      {
        ok: false,
        content: "{}",
        mtime: "",
        output: "Backend service unreachable.",
      },
      { status: 503 }
    );
  });
}

export async function POST(request: Request) {
  return await proxyOrRespond(request, "/api/dsh-settings", () => {
    return NextResponse.json(
      {
        ok: false,
        output: "Backend service unreachable.",
      },
      { status: 503 }
    );
  });
}
