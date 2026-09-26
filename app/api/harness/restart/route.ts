import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function POST(request: Request) {
  return await proxyOrRespond(request, "/api/harness/restart");
}
