import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin paths
  if (pathname.startsWith("/admin")) {
    const userRole = request.cookies.get("user-role")?.value;

    // Check if the cookie indicates 'admin' role
    if (userRole !== "admin") {
      // Redirect to login page
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure routes where this middleware should run
export const config = {
  matcher: ["/admin/:path*"],
};
