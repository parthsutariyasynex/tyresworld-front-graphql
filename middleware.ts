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

  // 1. If someone accesses /en, /ar, /en/..., /ar/..., redirect to clean URL
  if (pathname === "/en" || pathname === "/ar") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname.startsWith("/en/") || pathname.startsWith("/ar/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/(?:en|ar)/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  // Helper function to attach standard security headers
  const setSecurityHeaders = (res: NextResponse) => {
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("X-DNS-Prefetch-Control", "on");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    return res;
  };

  // 2. Bare root "/" → internally rewrite to "/en"
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/en";
    return setSecurityHeaders(NextResponse.rewrite(url));
  }

  // 3. If someone accesses /tyres?mgs_brand=<value> or /tyres?brand=<value>, redirect to /tyres/brand/<slug>
  if (pathname === "/tyres") {
    const brandVal = req.nextUrl.searchParams.get("mgs_brand") || req.nextUrl.searchParams.get("brand");
    if (brandVal) {
      const values = brandVal.split(",").filter(Boolean);
      if (values.length === 1) {
        const slug = values[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (slug) {
          const url = req.nextUrl.clone();
          url.pathname = `/tyres/brand/${slug}`;
          url.searchParams.delete("mgs_brand");
          url.searchParams.delete("brand");
          url.searchParams.delete("page");
          return NextResponse.redirect(url, 308);
        }
      }
    }
  }

  // 3b. Legacy tyre-size query URL → canonical /tyres/<w-h-r>(/<rear-w-h-r>)
  // slug. Generic numeric validation only — no hardcoded sizes; whatever
  // real width/height/rim values the query carries become the slug as-is.
  if (pathname === "/tyres") {
    const SIZE_RE = /^\d{1,3}(?:\.\d+)?$/;
    const w = req.nextUrl.searchParams.get("width");
    const h = req.nextUrl.searchParams.get("height");
    const r = req.nextUrl.searchParams.get("rim");
    if (w && h && r && SIZE_RE.test(w) && SIZE_RE.test(h) && SIZE_RE.test(r)) {
      const rw = req.nextUrl.searchParams.get("rear_width");
      const rh = req.nextUrl.searchParams.get("rear_height");
      const rr = req.nextUrl.searchParams.get("rear_rim");
      const hasRear = rw && rh && rr && SIZE_RE.test(rw) && SIZE_RE.test(rh) && SIZE_RE.test(rr);

      const url = req.nextUrl.clone();
      url.pathname = hasRear
        ? `/tyres/${w}-${h}-${r}/${rw}-${rh}-${rr}`
        : `/tyres/${w}-${h}-${r}`;
      url.searchParams.delete("width");
      url.searchParams.delete("height");
      url.searchParams.delete("rim");
      url.searchParams.delete("rear_width");
      url.searchParams.delete("rear_height");
      url.searchParams.delete("rear_rim");
      // The root Tyres category UID is already implied by the /tyres path —
      // redundant on the slug URL, so it doesn't carry over.
      url.searchParams.delete("category_uid");
      url.searchParams.delete("category_id");
      url.searchParams.delete("categoryUid");
      return NextResponse.redirect(url, 308);
    }
  }

  // 3c. Any direct /tyres/<size-slug> visit that still carries a category_uid
  // (bookmarked/shared old-style link, etc.) — strip it the same way, since
  // it's the same redundant root-category echo, not a real filter.
  if (
    pathname.startsWith("/tyres/") &&
    (req.nextUrl.searchParams.has("category_uid") ||
      req.nextUrl.searchParams.has("category_id") ||
      req.nextUrl.searchParams.has("categoryUid"))
  ) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("category_uid");
    url.searchParams.delete("category_id");
    url.searchParams.delete("categoryUid");
    return NextResponse.redirect(url, 308);
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  // 4. Handle removed synthetic slugs
  if (segments.length <= 2 && lastSegment && REMOVED_SYNTHETIC_SLUGS.has(lastSegment)) {
    const url = req.nextUrl.clone();
    url.pathname = `/tyres`;
    return NextResponse.redirect(url, 307);
  }

  // 4. If path is not an API route, internally rewrite to /en/<path>
  if (firstSegment !== "api") {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return setSecurityHeaders(NextResponse.rewrite(url));
  }

  const res = NextResponse.next();
  return setSecurityHeaders(res);
}

export const config = {
  // Run on pages only — skip Next internals, metadata routes and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|img|logo|images|fonts|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)).*)",
  ],
};
