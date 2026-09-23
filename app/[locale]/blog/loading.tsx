export default function Loading() {
  return (
    <div className="bg-white min-h-screen" dir="ltr">
      {/* ── Hero Banner Skeleton ── */}
      <div className="bg-gray-50 pt-2 pb-0.5">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl sm:rounded-2xl bg-gray-200 p-3.5 sm:p-4 md:p-5 h-[110px] sm:h-[130px] animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Search Bar Skeleton ── */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-10">
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        {/* ── Category Pills Skeleton ── */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>

        {/* ── Blog Posts Grid Skeleton ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              <div className="w-full aspect-[16/10] bg-gray-100 animate-pulse" />
              <div className="flex flex-col flex-1 p-5 sm:p-6 gap-2.5">
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded animate-pulse mt-1" />
                <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
