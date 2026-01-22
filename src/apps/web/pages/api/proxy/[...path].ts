import type { NextApiRequest, NextApiResponse } from "next";

// Proxies requests from /api/proxy/* to the backend API
// Base URL is taken from NEXT_PUBLIC_API_URL (preferred) or API_BASE_URL
const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "";

const ALLOW_INTERNAL = process.env.API_PROXY_ALLOW_INTERNAL === "true";

function parseBaseUrl(raw: string): URL | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!parsed.protocol || !["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed;
  } catch (_err) {
    return null;
  }
}

function isPrivateHost(host: string): boolean {
  const lowered = host.toLowerCase();
  const secondOctet = lowered.startsWith("172.")
    ? Number(lowered.split(".")[1])
    : null;
  return (
    lowered === "localhost" ||
    lowered === "127.0.0.1" ||
    lowered === "::1" ||
    lowered.startsWith("10.") ||
    lowered.startsWith("192.168.") ||
    (secondOctet !== null && secondOctet >= 16 && secondOctet <= 31) ||
    lowered.startsWith("169.254.") ||
    lowered.startsWith("fc") ||
    lowered.startsWith("fd")
  );
}

function ensureSafePath(segments: string | string[] | undefined) {
  const parts = Array.isArray(segments) ? segments : segments ? [segments] : [];
  const normalized = parts
    .flatMap((part) => part.split("/").filter(Boolean))
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of normalized) {
    if (part === "..") {
      throw new Error("Path traversal is not allowed");
    }
    if (/^https?:/i.test(part) || part.startsWith("//")) {
      throw new Error("Absolute URLs are not allowed in proxy path");
    }
  }

  return normalized.join("/");
}

function buildTargetUrl(req: NextApiRequest, base: URL) {
  const rawQuery =
    req.url && req.url.includes("?")
      ? req.url.substring(req.url.indexOf("?"))
      : "";

  const safePath = ensureSafePath(req.query.path);

  const target = new URL(base.href);
  const basePath = base.pathname.replace(/\/$/, "");
  target.pathname = [basePath, safePath].filter(Boolean).join("/");
  target.search = rawQuery;

  if (target.origin !== base.origin) {
    throw new Error("Proxy target origin mismatch");
  }

  return target;
}

function forwardableHeaders(req: NextApiRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    // Skip hop-by-hop and Next internal headers
    const lower = key.toLowerCase();
    if (
      [
        "host",
        "connection",
        "content-length",
        "accept-encoding",
        "x-vercel-id",
        "x-vercel-deployment-url",
      ].includes(lower)
    ) {
      continue;
    }
    // Multiple values can be string[]
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    } else {
      headers.set(key, value as string);
    }
  }
  return headers;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const base = parseBaseUrl(RAW_API_BASE);

  if (!base) {
    res.status(500).json({
      ok: false,
      error:
        "API base URL not configured (set NEXT_PUBLIC_API_URL or API_BASE_URL)",
    });
    return;
  }

  if (!ALLOW_INTERNAL && isPrivateHost(base.hostname)) {
    res.status(400).json({
      ok: false,
      error: "Proxy base host is not allowed",
    });
    return;
  }

  let url: URL;
  try {
    url = buildTargetUrl(req, base);
  } catch (err: any) {
    res.status(400).json({
      ok: false,
      error: "Invalid proxy path",
      detail: err?.message || String(err),
    });
    return;
  }
  const headers = forwardableHeaders(req);

  let body: BodyInit | undefined;
  const method = (req.method || "GET").toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    // If Next parsed body as object, serialize JSON; otherwise pass through string
    const contentType = (req.headers["content-type"] || "").toString();
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body && contentType.includes("application/json")) {
      body = JSON.stringify(req.body);
      // Ensure content-type header present
      if (!headers.has("content-type"))
        headers.set("content-type", "application/json");
    } else {
      // Fallback: no body (for unsupported encodings in this simple proxy)
      body = undefined;
    }
  }

  try {
    const resp = await fetch(url, {
      method,
      headers,
      body,
    });

    // Copy status and headers
    res.status(resp.status);
    resp.headers.forEach((value, key) => {
      // Avoid setting duplicate or forbidden headers
      if (["transfer-encoding"].includes(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    // Send body
    const buffer = Buffer.from(await resp.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    res.status(502).json({
      ok: false,
      error: "Proxy request failed",
      detail: err?.message || String(err),
    });
  }
}

export const config = {
  api: {
    // Keep default bodyParser (true). If you need raw bodies (e.g., webhooks), set to false and handle streams.
    bodyParser: true,
    externalResolver: true,
  },
};
