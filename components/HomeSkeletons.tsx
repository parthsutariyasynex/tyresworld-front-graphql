import React from "react";

/**
 * 1. Hero Banner + Tyre Finder Skeleton
 */
export function HeroSliderSkeleton() {
  return (
    <section className="relative w-full bg-black/90 pb-12 animate-pulse">
      {/* Hero Banner Area */}
      <div className="w-full aspect-[16/6] min-h-[360px] bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/5" />
      </div>

      {/* Tyre Finder Overlay Skeleton */}
      <div className="container max-w-6xl mx-auto px-4 -mt-16 sm:-mt-24 relative z-10">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">
            <div className="w-32 h-9 rounded-lg bg-gray-200" />
            <div className="w-32 h-9 rounded-lg bg-gray-100" />
          </div>
          {/* Form Selects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="h-12 rounded-xl bg-gray-100" />
            <div className="h-12 rounded-xl bg-gray-100" />
            <div className="h-12 rounded-xl bg-gray-100" />
            <div className="h-12 rounded-xl bg-red-100" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 2. Special Offers Skeleton (3 rounded cards)
 */
export function OffersSkeleton() {
  return (
    <section className="py-12 md:py-16 bg-white animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="h-8 w-56 bg-gray-200 rounded-lg mx-auto mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[3/2] rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 3. Fast Selling Tyres Skeleton (4 product cards)
 */
export function FastSellingSkeleton() {
  return (
    <section className="py-12 lg:py-16 bg-[#f8f8f8] animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="h-8 w-60 bg-gray-200 rounded-lg mx-auto" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
              <div className="w-full aspect-square bg-gray-100 rounded-lg" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-6 w-24 bg-gray-200 rounded mt-auto" />
              <div className="h-10 w-full bg-red-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 4. Wide Range Services Skeleton (9 service cards)
 */
export function WideRangeServicesSkeleton() {
  return (
    <section className="py-12 lg:py-16 bg-white animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 5. Brand Strip Skeleton (Grid of brand logos)
 */
export function BrandStripSkeleton() {
  return (
    <section className="py-12 lg:py-16 bg-white border-t border-gray-100 animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="h-8 w-56 bg-gray-200 rounded-lg mx-auto mb-2" />
          <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center p-3">
              <div className="w-20 h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 6. FAQ Skeleton
 */
export function FaqSkeleton() {
  return (
    <section className="py-12 lg:py-16 bg-[#f8f8f8] animate-pulse">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <div className="h-8 w-72 bg-gray-200 rounded-lg mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 flex justify-between items-center">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 7. Automotive Blog Skeleton (4 cards)
 */
export function AutomotiveBlogSkeleton() {
  return (
    <section className="py-12 lg:py-16 bg-white animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="h-8 w-56 bg-gray-200 rounded-lg mx-auto mb-2" />
          <div className="h-4 w-40 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-white flex flex-col gap-3 pb-4">
              <div className="w-full aspect-[16/10] bg-gray-200" />
              <div className="px-4 space-y-2">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-3 w-4/5 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Full Complete Homepage Skeleton (Exactly matches the active sections)
 */
export default function HomepageSkeleton() {
  return (
    <div className="w-full">
      <HeroSliderSkeleton />
      <OffersSkeleton />
      <BrandStripSkeleton />
      <AutomotiveBlogSkeleton />
    </div>
  );
}
