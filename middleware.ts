import { NextResponse, type NextRequest } from "next/server";

/**
 * Removed synthetic listing pages — Magento has no real attribute
 * distinguishing on-road from off-road/4x4 tyres, and the product filter for
 * these was never actually wired, so both pages silently rendered the entire
 * unfiltered Tyres catalog under a misleading curated title. Redirected here
 * (not just in the [locale]/[...slug] page component) so this is a real HTTP
 * 307, not a client-side meta-refresh — a redirect() thrown after the root
 * layout starts streaming degrades to that weaker form.
 */
const REMOVED_SYNTHETIC_SLUGS = new Set(["on-road-tires", "off-road-tires-4x4"]);

/**
 * Edge middleware:
 *  - Redirects the bare root "/" to the default locale.
 *  - Redirects removed synthetic listing pages to the real Tyres category.
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

  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] === "ar" ? "ar" : "en";
  const lastSegment = segments[segments.length - 1];

  if (segments.length <= 2 && lastSegment && REMOVED_SYNTHETIC_SLUGS.has(lastSegment)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/tyres`;
    return NextResponse.redirect(url, 307);
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
