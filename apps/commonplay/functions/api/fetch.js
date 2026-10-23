// Cloudflare Pages Function: GET /api/fetch?url=<encoded URL>
// A narrow pass-through so the browser can read sources that don't send CORS headers
// (ccMixter's API and files) and so ZIP downloads never fail on a missing header.
// Only the hosts below are allowed, only GET, and nothing is cached or logged.

const ALLOWED = [
  /^ccmixter\.org$/,
  /^([a-z0-9-]+\.)*archive\.org$/,
  /^upload\.wikimedia\.org$/,
  /^([a-z0-9-]+\.)*storage\.jamendo\.com$/,
  /^([a-z0-9-]+\.)*jamendo\.com$/,
];
const MAX_BYTES = 200 * 1024 * 1024; // one track; anything bigger is refused

export async function onRequestGet({ request }) {
  const target = new URL(request.url).searchParams.get("url");
  let u;
  try { u = new URL(target); } catch { return err(400, "Missing or invalid url"); }
  if (u.protocol !== "https:" && u.protocol !== "http:") return err(400, "Only http(s) URLs");
  if (!ALLOWED.some(rx => rx.test(u.hostname))) return err(403, "Host not allowed");

  const headers = { "User-Agent": "Commonplay/1.0 (+open music player)", "Accept": "*/*" };
  // ccMixter only serves files to requests coming from its own pages.
  if (/ccmixter\.org$/.test(u.hostname)) headers.Referer = "https://ccmixter.org/";
  const range = request.headers.get("Range");
  if (range) headers.Range = range;

  const upstream = await fetch(u.toString(), { headers, redirect: "follow", cf: { cacheTtl: 3600, cacheEverything: true } });
  // Refuse redirects that land on a host outside the allowlist.
  try { if (!ALLOWED.some(rx => rx.test(new URL(upstream.url).hostname))) return err(403, "Redirected to a host that isn't allowed"); } catch {}
  const len = +upstream.headers.get("content-length") || 0;
  if (len > MAX_BYTES) return err(413, "File too large");

  const out = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
    const v = upstream.headers.get(h); if (v) out.set(h, v);
  }
  out.set("Access-Control-Allow-Origin", "*");
  out.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");
  out.set("Cache-Control", "public, max-age=3600");
  out.set("X-Content-Type-Options", "nosniff");
  // Never let proxied content run as a page on our origin.
  out.set("Content-Security-Policy", "default-src 'none'; sandbox");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Range" } });
}

function err(status, message) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
