import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { getBlogPost, decodeBlogHtml } from "@/lib/services/blog.service";
import { storeCode } from "@/lib/i18n";
import { APP_CONFIG } from "@/src/config/app-config";
import PageHeroBanner from "@/components/PageHeroBanner";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const store = storeCode("en");
  const post = await getBlogPost(params.slug, store);
  if (!post) return { title: "Blog" };

  return {
    title: post.meta_keywords || post.title || "Blog",
    description: post.meta_description || undefined,
    alternates: { canonical: `/${params.locale}/blog/${params.slug}` },
    openGraph: {
      title: post.title || undefined,
      description: post.meta_description || undefined,
      type: "article",
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  if (locale !== "en") notFound();
  const store = storeCode(locale as "en");

  const post = await getBlogPost(slug, store);
  if (!post || !post.content) notFound();

  const html = decodeBlogHtml(post.content, locale);
  const date = post.published_at ?? post.created_at;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.image ? [post.image] : undefined,
    datePublished: post.published_at ?? undefined,
    dateCreated: post.created_at ?? undefined,
    author: post.author ? { "@type": "Organization", name: post.author } : undefined,
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${slug}`,
  };

  return (
    <div className="bg-white min-h-screen" dir="ltr">
      <JsonLd data={articleJsonLd} />

      <PageHeroBanner title={post.title || "Blog"} />

      {/* ── Post Content Area ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {date && (
          <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider mb-6">
            {new Date(date.replace(" ", "T")).toLocaleDateString(
              "en-US",
              { month: "long", day: "numeric", year: "numeric" },
            )}
          </p>
        )}

        {post.image && (
          <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 mb-10 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt={post.title ?? ""} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="cms-content prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#ed1c24] hover:underline"
          >
            <span>← Back to all posts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
