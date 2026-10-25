import { timingSafeEqual } from "node:crypto";
import { handle, settleRounds } from "../server/game.js";
import { authHandler, googleConfigured } from "../server/auth.js";

const noStore = { "Cache-Control": "no-store" };

// Vercel can hand functions an http:// URL behind its TLS proxy. Rebuild the
// request with the public origin so the same-origin check and Auth.js agree
// with what the browser sent.
async function normalise(req: Request): Promise<Request> {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    url.protocol.replace(":", "");
  if (!host || `${proto}://${host}` === url.origin) return req;
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();
  return new Request(`${proto}://${host}${url.pathname}${url.search}`, {
    method: req.method,
    headers: req.headers,
    body,
  });
}

function cronAllowed(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export default {
  async fetch(incoming: Request): Promise<Response> {
    const req = await normalise(incoming);
    const { pathname } = new URL(req.url);
    if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
      const response = await authHandler(req);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (pathname === "/api/config")
      return Response.json({ google: googleConfigured() }, { headers: noStore });
    if (pathname === "/api/cron/settle") {
      if (!cronAllowed(req))
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      await settleRounds();
      return Response.json({ ok: true }, { headers: noStore });
    }
    const response = await handle(req);
    response.headers.set("Cache-Control", "no-store");
    return response;
  },
};
