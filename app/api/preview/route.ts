import { proxyOrRespond } from "@/lib/workstation/server-state";

export async function GET(request: Request) {
  return await proxyOrRespond(request, "/api/preview", () => {
    const appHost =
      process.env.NEXT_PUBLIC_CLOUDFLARED_APP_HOSTNAME ||
      process.env.CLOUDFLARED_APP_HOSTNAME ||
      "";
    const dshHost =
      process.env.NEXT_PUBLIC_CLOUDFLARED_DSH_HOSTNAME ||
      process.env.CLOUDFLARED_DSH_HOSTNAME ||
      "";
    const formatUrl = (h: string) => {
      const clean = h.trim().replace(/^['"]|['"]$/g, "");
      if (!clean) return "";
      return clean.startsWith("http://") || clean.startsWith("https://")
        ? clean
        : `https://${clean}`;
    };

    return new Response(
      JSON.stringify({
        ok: true,
        text: "Workstation daemon preview endpoint offline.",
        anywhereApp: formatUrl(appHost),
        anywhereDsh: formatUrl(dshHost),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  });
}

