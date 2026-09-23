export default function Loading() {
  return (
    <div className="bg-white min-h-screen" dir="ltr">
      {/* ── Hero Banner Skeleton ── */}
      <div className="bg-gray-50 pt-2 pb-0.5">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl sm:rounded-2xl bg-gray-200 p-3.5 sm:p-4 md:p-5 h-[110px] sm:h-[130px] animate-pulse" />
        </div>
      </div>

      {/* ── Post Content Skeleton ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="w-full aspect-[16/9] rounded-2xl bg-gray-100 animate-pulse mb-10" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-11/12" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  );
}
