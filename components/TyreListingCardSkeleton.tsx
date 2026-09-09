export default function TyreListingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-pulse">
      {/* Top Image area */}
      <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center p-4">
        <div className="w-3/4 h-3/4 bg-gray-200 rounded-full" />
      </div>

      {/* Content area */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />

        {/* Store */}
        <div className="h-3 bg-gray-100 rounded w-1/3 mt-1" />

        {/* Price */}
        <div className="h-6 bg-gray-200 rounded w-1/2 mt-2" />

        {/* Subtype */}
        <div className="h-3 bg-gray-100 rounded w-2/5" />

        {/* Stock */}
        <div className="h-3 bg-emerald-100 rounded w-1/4" />

        {/* Bottom actions */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <div className="h-5 w-14 bg-emerald-50 rounded-md" />
            <div className="h-5 w-14 bg-emerald-50 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-emerald-800/30 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
