export default function TyreListingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col animate-pulse">
      {/* Brand header — matches h-[60px] */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-gray-100">
        <div className="h-7 w-24 bg-gray-200 rounded" />
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-12 bg-gray-100 rounded" />
          <div className="h-4 w-4 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Tyre image area — aspect 4/3 with warranty + year placeholders */}
      <div className="relative bg-white" style={{ aspectRatio: "4/3" }}>
        <div className="absolute inset-0 bg-gray-100 m-4 rounded" />
        <div className="absolute bottom-2 left-0 bg-gray-200 h-[15px] w-28" />
        <div className="absolute bottom-2 right-2 bg-gray-200 h-3 w-8 rounded" />
      </div>

      {/* Name + size */}
      <div className="px-3 pt-3 text-center">
        <div className="h-9 flex flex-col items-center justify-between py-[3px]">
          <div className="h-3 w-11/12 bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto mt-1" />
      </div>

      {/* Vehicle info row */}
      <div className="grid grid-cols-3 items-center h-[44px] bg-white mt-3">
        <div className="flex items-center justify-start pl-4">
          <div className="w-10 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center justify-center gap-1">
          <div className="w-4 h-4 bg-gray-200 rounded-full" />
          <div className="w-12 h-3 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center justify-center">
          <div className="w-8 h-3 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Rating */}
      <div className="flex justify-center mt-3 px-3 h-[18px] items-center">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[13px] h-[13px] bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      {/* Price section */}
      <div className="text-center mt-3 pt-3 px-4 border-t border-gray-100">
        <div className="h-2.5 w-24 bg-gray-100 rounded mx-auto" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto mt-1" />
      </div>

      {/* Installments */}
      <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 flex-wrap">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-[18px] w-10 bg-gray-200 rounded-full" />
        <div className="h-[18px] w-12 bg-gray-200 rounded-full" />
      </div>

      {/* CTA area (quantity + add to cart) */}
      <div className="px-4 pb-4 mt-auto">
        <div className="flex items-center gap-2">
          {/* Quantity selector placeholder */}
          <div className="w-[107px] h-[42px] border border-gray-200 rounded-full bg-gray-50 flex-shrink-0" />
          {/* Add to cart button placeholder */}
          <div className="flex-1 h-[42px] bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
