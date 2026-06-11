export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/5] rounded-2xl bg-ink/6 mb-4 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-ink/5 via-ink/8 to-ink/5" />
      </div>

      {/* Category line */}
      <div className="h-2.5 w-16 rounded-full bg-ink/8 mb-2" />

      {/* Product name — two lines */}
      <div className="h-3.5 w-4/5 rounded-full bg-ink/10 mb-1.5" />
      <div className="h-3.5 w-3/5 rounded-full bg-ink/8 mb-3" />

      {/* Stars row */}
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm bg-ink/8" />
        ))}
        <div className="h-2.5 w-8 rounded-full bg-ink/6 ml-1" />
      </div>

      {/* Price */}
      <div className="h-4 w-16 rounded-full bg-ink/10" />
    </div>
  );
}
