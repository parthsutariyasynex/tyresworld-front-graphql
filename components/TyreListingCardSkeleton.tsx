export default function TyreListingCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs animate-pulse">
      <div className="flex flex-col flex-1 p-3.5 pt-2">
        {/* Tyre Image area (with top-right logo placeholder) */}
        <div className="relative w-full pb-1 flex items-center justify-center">
          <div className="absolute right-0 top-0 h-4 w-16 bg-gray-200 rounded" />
          <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-100 rounded-full mt-1" />
        </div>

        {/* Spec Pill area */}
        <div className="flex justify-center mb-2">
          <div className="h-5 w-44 bg-gray-100 rounded-full" />
        </div>

        {/* Pattern Name */}
        <div className="text-center mb-2 px-1">
          <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
        </div>

        {/* Tyre Size & Vehicle Box */}
        <div className="border border-gray-200/90 rounded-lg py-2 px-3 flex items-center justify-between mb-2.5 bg-gray-50">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-10 bg-gray-200 rounded" />
        </div>

        {/* Price Section */}
        <div className="text-center px-1 my-0.5 space-y-1">
          <div className="h-3 bg-gray-100 rounded w-32 mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-28 mx-auto my-0.5" />
          <div className="h-3.5 bg-gray-100 rounded w-24 mx-auto" />
        </div>

        {/* Installments */}
        <div className="flex items-center justify-center gap-1.5 my-2.5">
          <div className="h-3.5 w-24 bg-gray-100 rounded" />
          <div className="h-4 w-10 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <div className="h-10 w-14 bg-gray-200 rounded-lg shrink-0" />
          <div className="h-10 flex-1 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
