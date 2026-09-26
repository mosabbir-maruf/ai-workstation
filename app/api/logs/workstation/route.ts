import {
  createUnavailableSseStream,
  proxyOrRespond,
} from "@/lib/workstation/server-state";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/logs/workstation", () => {
    return createUnavailableSseStream("/api/logs/workstation");
  });
}
