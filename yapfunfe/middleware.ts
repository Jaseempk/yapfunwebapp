import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Get authentication info from cookies
  const connectedAddress = request.cookies.get("connected_address")?.value;
  const isWalletConnected =
    request.cookies.get("wallet_connected")?.value === "true";

  // Protected routes that require wallet connection
  const protectedRoutes = ["/profile", "/positions"];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // If it's a protected route and no wallet is connected
  if (isProtectedRoute && (!isWalletConnected || !connectedAddress)) {
    // Store the attempted URL to redirect back after connecting
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("redirect_after_connect", path, {
      path: "/",
      maxAge: 300, // 5 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  // If accessing /profile without an address parameter, redirect to their profile
  if (path === "/profile" && connectedAddress) {
    return NextResponse.redirect(
      new URL(`/profile/${connectedAddress}`, request.url)
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Add cache control for static assets
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/images/") ||
    path.includes(".")
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  } else {
    // For dynamic routes, prevent caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*$).*)",
  ],
};
