"use client";

interface Props {
  content: string | null;
  loading?: boolean;
  dir?: "ltr" | "rtl";
}

export default function CategorySeoSection({ content, loading, dir = "ltr" }: Props) {
  if (loading) {
    return (
      <div className="bg-white py-12 border-t border-gray-100">
        <div className="container animate-pulse space-y-4 max-w-5xl">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
          <div className="h-4 w-4/5 bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded mt-4" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <section className="bg-white py-12 border-t border-gray-100" dir={dir}>
      <div className="container max-w-5xl">
        <div
          className="cms-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}
