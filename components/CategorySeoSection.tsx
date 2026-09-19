"use client";

interface Props {
  content: string | null;
  loading?: boolean;
  dir?: "ltr" | "rtl";
}

export default function CategorySeoSection({ content, loading, dir = "ltr" }: Props) {
  if (loading || !content) return null;

  // Check if content has actual text or images, avoiding empty containers
  const textOnly = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
  const hasImages = /<img/i.test(content);
  if (!textOnly && !hasImages) return null;

  return (
    <section className="bg-white py-6 border-t border-gray-100" dir={dir}>
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div
          className="cms-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}
