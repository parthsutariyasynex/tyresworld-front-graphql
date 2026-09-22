import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts, excerptFromHtml } from "@/lib/services/blog.service";
import { storeCode } from "@/lib/i18n";

/** GET /api/blog?pageSize=4&currentPage=1&category=car-tyres-uae&locale=en
    Real blog posts (Klever kleverBlogPosts) for client components — the
    homepage teaser (components/AutomotiveBlog.tsx). The full /blog listing
    and /blog/[slug] pages fetch server-side directly via the service
    instead of this route. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get("pageSize") ?? 4);
  const currentPage = Number(searchParams.get("currentPage") ?? 1);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const locale = "en";

  const { posts, total } = await getBlogPosts({
    pageSize,
    currentPage,
    categoryUrlKey: category,
    search,
    store: storeCode(locale),
  });

  const items = posts.map((p) => ({
    slug: p.url_key ?? "",
    title: p.title ?? "",
    date: p.published_at ?? p.created_at ?? "",
    excerpt: p.short_content ? excerptFromHtml(p.short_content) : "",
    image: p.thumbnail ?? p.image ?? "",
  }));

  return NextResponse.json(
    { posts: items, total },
    { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" } },
  );
}
