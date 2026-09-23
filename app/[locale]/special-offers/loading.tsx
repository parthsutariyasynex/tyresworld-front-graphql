export default function Loading() {
  return (
    <div className="so-page">
      {/* ── Hero Banner Skeleton ── */}
      <div className="bg-gray-50 pt-2 pb-0.5">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl sm:rounded-2xl bg-gray-200 p-3.5 sm:p-4 md:p-5 h-[110px] sm:h-[130px] animate-pulse" />
        </div>
      </div>

      <div className="so-container so-body">
        {/* ── Offer Banners Skeleton ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full aspect-[559/391] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* ── Prose Skeleton ── */}
        <div className="max-w-3xl mx-auto space-y-3 mb-10">
          <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* ── FAQ Skeleton ── */}
        <div className="max-w-3xl mx-auto space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
