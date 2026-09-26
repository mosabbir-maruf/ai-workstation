import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/cache");
}
