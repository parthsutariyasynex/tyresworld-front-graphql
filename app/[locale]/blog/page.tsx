import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPosts, getBlogCategories, excerptFromHtml } from "@/lib/services/blog.service";
import { storeCode } from "@/lib/i18n";
import BlogSearchBar from "@/components/blog/BlogSearchBar";
import PageHeroBanner from "@/components/PageHeroBanner";

/**
 * Real blog listing — Magento's Klever module (kleverBlogPosts / kleverBlogCategories)
 */

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; search?: string };
}): Promise<Metadata> {
  const title = "Explore Our Blog – Tyre Advice & Car Maintenance Tips | TyresWorld UAE";
  return {
    title,
    description: "Tyre buying advice, car maintenance tips, and driving guides for the UAE.",
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; page?: string; search?: string };
}) {
  const { locale } = params;
  if (locale !== "en") notFound();
  const store = storeCode(locale as "en");

  const currentPage = Math.max(1, Number(searchParams.page ?? 1));
  const categoryUrlKey = searchParams.category;
  const searchQuery = searchParams.search?.trim();

  const [{ posts, total }, categories] = await Promise.all([
    getBlogPosts({
      categoryUrlKey,
      search: searchQuery,
      pageSize: PAGE_SIZE,
      currentPage,
      store,
    }),
    getBlogCategories(store),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCategory = categories?.find((c) => c.url_key === categoryUrlKey);

  return (
    <div className="bg-white min-h-screen" dir="ltr">
      <PageHeroBanner
        title="Explore Our Blog – Tyre Advice & Car Maintenance Tips"
        breadcrumbLabel="Blog"
      />

      {/* ── Main Content Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Search Bar (Matching Screenshot) ── */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-10">
          <BlogSearchBar
            locale={locale}
            initialQuery={searchQuery}
            placeholder="Search blog posts..."
          />
        </div>

        {/* ── Categories Filter Pills ── */}
        {categories && categories.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 mb-10">
            <Link
              href={`/${locale}/blog${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                !categoryUrlKey
                  ? "bg-[#ed1c24] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </Link>
            {categories.map((c) => {
              const qs = new URLSearchParams();
              qs.set("category", c.url_key ?? "");
              if (searchQuery) qs.set("search", searchQuery);
              return (
                <Link
                  key={c.category_id}
                  href={`/${locale}/blog?${qs.toString()}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    categoryUrlKey === c.url_key
                      ? "bg-[#ed1c24] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c.title}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Active Search Info ── */}
        {searchQuery && (
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">
              {`Search results for: "${searchQuery}"`}{" "}
              <span className="text-gray-500 font-normal">({total})</span>
            </p>
            <Link
              href={`/${locale}/blog${categoryUrlKey ? `?category=${categoryUrlKey}` : ""}`}
              className="text-xs font-bold text-[#ed1c24] hover:underline"
            >
              Clear search
            </Link>
          </div>
        )}

        {/* ── Blog Posts Grid (Matching Screenshot) ── */}
        {posts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
            <p className="text-gray-800 text-base font-bold mb-2">
              No posts found.
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Try searching with different keywords or select a different category.
            </p>
            <Link
              href={`/${locale}/blog`}
              className="btn-slide-red inline-block px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg"
            >
              View All Posts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => {
              const href = `/${locale}/blog/${post.url_key}`;
              const date = post.published_at ?? post.created_at;

              return (
                <article
                  key={post.post_id}
                  className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <Link href={href} className="block relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.thumbnail ?? post.image ?? ""}
                      alt={post.title ?? ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex flex-col flex-1 p-5 sm:p-6">
                    {date && (
                      <time className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">
                        {new Date(date.replace(" ", "T")).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </time>
                    )}

                    <h2 className="text-base sm:text-lg font-black text-gray-950 leading-snug mb-2.5 line-clamp-2">
                      <Link href={href} className="text-gray-950 group-hover:text-[#ed1c24] transition-colors">
                        {post.title}
                      </Link>
                    </h2>

                    {post.short_content && (
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                        {excerptFromHtml(post.short_content)}
                      </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                      <Link
                        href={href}
                        className="text-xs font-black uppercase tracking-wider text-[#ed1c24] group-hover:underline inline-flex items-center gap-1"
                      >
                        <span>Read More</span>
                        <span className="text-sm">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const qs = new URLSearchParams();
              if (categoryUrlKey) qs.set("category", categoryUrlKey);
              if (searchQuery) qs.set("search", searchQuery);
              if (p > 1) qs.set("page", String(p));
              const href = `/${locale}/blog${qs.toString() ? `?${qs}` : ""}`;
              return (
                <Link
                  key={p}
                  href={href}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    p === currentPage
                      ? "bg-[#ed1c24] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
