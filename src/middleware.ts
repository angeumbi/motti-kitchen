import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin paths
  if (pathname.startsWith("/admin")) {
    const userRole = request.cookies.get("user-role")?.value;
    const userEmail = request.cookies.get("user-email")?.value;

    // Check if the cookie indicates 'admin' role and matches owner's email
    if (
      userRole !== "admin" || 
      (userEmail !== "o1027770162@gmail.com" && userEmail !== "admin@mottikitchen.com")
    ) {
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
