import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware:
 *  - Redirects the bare root "/" to the default locale.
 *  - Adds baseline security headers to every (non-asset) response.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bare root → default locale home.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "on");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  return res;
}

export const config = {
  // Run on pages only — skip Next internals, metadata routes and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|img|logo|images|fonts|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)).*)",
  ],
};
