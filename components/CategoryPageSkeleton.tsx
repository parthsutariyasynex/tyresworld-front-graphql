import TyreListingCardSkeleton from "./TyreListingCardSkeleton";

export default function CategoryPageSkeleton() {
  return (
    <div>
      {/* Header Banner Skeleton */}
      <div className="bg-black py-14 lg:py-20 text-center relative">
        <div className="container">
          <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black uppercase tracking-wide text-white leading-tight">
            <span className="inline-block bg-white/10 rounded animate-pulse w-72 h-10" />
          </h1>
        </div>
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-2.5 flex justify-center">
          <nav className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100/90 border border-gray-200/80 rounded-full shadow-2xs">
            <span className="inline-block bg-gray-200 rounded-full animate-pulse w-14 h-4" />
            <span className="inline-block bg-gray-200 rounded-full animate-pulse w-3 h-3" />
            <span className="inline-block bg-gray-300 rounded-full animate-pulse w-24 h-5" />
          </nav>
        </div>
      </div>

      {/* Filter / Sort bar skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-[70px] z-30">
        <div className="container py-3 flex items-center justify-between gap-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          <div className="flex items-center gap-2">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24" />
            <div className="w-[42px] h-[42px] bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="bg-gray-50">
        <div className="container py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <TyreListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
