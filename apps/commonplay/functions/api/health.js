// GET /api/health — lets the app know the proxy is running, which switches on ccMixter.
export function onRequestGet() {
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
