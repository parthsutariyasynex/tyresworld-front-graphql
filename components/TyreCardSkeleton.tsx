export default function TyreCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden flex flex-col animate-pulse">

      {/* Brand header — matches minHeight: 62px */}
      <div
        className="flex flex-col items-center justify-center gap-1 border-b border-gray-100 bg-gray-100"
        style={{ minHeight: "62px" }}
      >
        <div className="h-5 w-28 bg-gray-200 rounded" />
        <div className="h-2 w-20 bg-gray-100 rounded" />
      </div>

      {/* Image area — aspect 4/3 with warranty + year placeholders */}
      <div className="relative bg-gray-50" style={{ aspectRatio: "4/3" }}>
        <div className="absolute bottom-0 left-0 h-5 w-24 bg-gray-200" />
        <div className="absolute bottom-1.5 right-3 h-3 w-8 bg-gray-200 rounded" />
      </div>

      {/* Info section */}
      <div className="flex flex-col px-3.5 pt-3 pb-3.5 gap-1.5 flex-1">

        {/* Pattern name — 2 lines */}
        <div className="h-3.5 w-full bg-gray-200 rounded" />
        <div className="h-3.5 w-2/3 bg-gray-200 rounded" />

        {/* Size + load index */}
        <div className="h-3 w-1/2 bg-gray-100 rounded" />

        {/* Car + country row */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-8 bg-gray-200 rounded" />
          <div className="h-3 w-14 bg-gray-100 rounded" />
        </div>

        {/* Rating */}
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-3 h-3 bg-gray-200 rounded" />
          ))}
        </div>

        <div className="border-t border-gray-100 my-0.5" />

        {/* Price label + amount */}
        <div>
          <div className="h-2 w-28 bg-gray-100 rounded mb-1.5" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>

        {/* Installments */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-4 w-10 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>

        {/* Contact Us button */}
        <div className="h-9 w-full bg-gray-200 rounded-full mt-1" />

      </div>
    </div>
  );
}
