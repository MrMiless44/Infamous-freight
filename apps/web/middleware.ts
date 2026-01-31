import { NextRequest, NextResponse } from "next/server";
import { supabaseMiddleware } from "./src/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/loads", "/threads"];

/**
 * Edge Middleware - Geolocation & Performance
 * Runs at the edge before page rendering for optimal performance
 */
export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const geo = (
    request as NextRequest & {
      geo?: {
        country?: string;
        city?: string;
        region?: string;
        latitude?: string;
        longitude?: string;
      };
    }
  ).geo;
  
  // Extract geolocation data from Vercel Edge
  const country = geo?.country || "Unknown";
  const city = geo?.city || "Unknown";
  const region = geo?.region || "Unknown";
  const latitude = geo?.latitude || null;
  const longitude = geo?.longitude || null;

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Add geolocation headers for API consumption
  requestHeaders.set("x-user-country", country);
  requestHeaders.set("x-user-city", city);
  requestHeaders.set("x-user-region", region);
  if (latitude) {
    requestHeaders.set("x-user-latitude", latitude);
  }
  if (longitude) {
    requestHeaders.set("x-user-longitude", longitude);
  }
  
  // Add performance hints
  requestHeaders.set("x-edge-processed", "true");
  requestHeaders.set("x-edge-timestamp", new Date().toISOString());

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const { supabase } = supabaseMiddleware(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  // Add CORS headers for API proxying
  if (nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  // Add cache headers for static assets
  if (
    nextUrl.pathname.startsWith("/static/") ||
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)$/)
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  }

  // Add security headers
  response.headers.set("X-Geo-Country", country);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// Configure which paths should run through middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
