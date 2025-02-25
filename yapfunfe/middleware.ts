import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Get the connected wallet address from headers or cookies if available
  const connectedAddress = request.cookies.get("connected_address")?.value;

  // Protected routes that require wallet connection
  const protectedRoutes = ["/profile", "/positions"];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // If it's a protected route and no wallet is connected
  if (isProtectedRoute && !connectedAddress) {
    // Redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing /profile without an address, redirect to their profile
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
