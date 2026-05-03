import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // app.arya-testnet.com → rewrite to /app routes
  if (hostname.startsWith("app.")) {
    // If visiting root of app subdomain, rewrite to /app
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.rewrite(url);
    }
    // If path doesn't start with /app, prefix it
    if (!pathname.startsWith("/app") && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      const url = request.nextUrl.clone();
      url.pathname = `/app${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // arya-testnet.com (no subdomain) → block /app routes, serve landing only
  if (!hostname.startsWith("app.") && pathname.startsWith("/app")) {
    // Redirect to app subdomain
    const url = request.nextUrl.clone();
    url.host = `app.${hostname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)"],
};
