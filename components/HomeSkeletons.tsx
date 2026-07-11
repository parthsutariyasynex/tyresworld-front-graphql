import React from "react";

export function HeroSliderSkeleton() {
  return (
    <div className="banner-aspect relative w-full overflow-hidden bg-gray-900 animate-pulse">
      {/* shimmer sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-700/40 to-gray-900 animate-[shimmer_1.8s_infinite]" />
      {/* dots row at bottom — matches Swiper pagination position */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`rounded-full bg-white/20 ${i === 0 ? "w-6 h-2" : "w-2 h-2"}`} />
        ))}
      </div>
      {/* arrow placeholders bottom-right */}
      <div className="absolute bottom-6 right-6 lg:right-10 flex gap-2">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="w-10 h-10 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function BrandStripSkeleton() {
  return (
    <div className="py-16 border-y border-ink/5 animate-pulse bg-white">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="h-10 w-24 rounded-lg bg-ink/8" />
              <div className="h-3 w-16 rounded bg-ink/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FaqSkeleton() {
  return (
    <div className="py-20 lg:py-28 bg-cream animate-pulse">
      <div className="container max-w-3xl">
        <div className="text-center mb-14">
          <div className="h-4 w-32 rounded bg-ink/8 mx-auto mb-4" />
          <div className="h-8 w-64 rounded bg-ink/10 mx-auto" />
        </div>
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-ink/5">
              <div className="flex justify-between items-center">
                <div className="h-4 w-2/3 rounded bg-ink/8" />
                <div className="h-4 w-4 rounded bg-ink/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FooterSkeleton() {
  return (
    <div className="bg-ink text-white/10 py-16 lg:py-20 animate-pulse">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <div className="h-8 w-24 rounded bg-white/10 mb-5" />
            <div className="h-4 w-48 rounded bg-white/5 mb-3" />
            <div className="h-4 w-36 rounded bg-white/5" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="col-span-1">
              <div className="h-4 w-16 rounded bg-white/10 mb-5" />
              <div className="flex flex-col gap-3">
                <div className="h-3.5 w-16 rounded bg-white/5" />
                <div className="h-3.5 w-20 rounded bg-white/5" />
                <div className="h-3.5 w-12 rounded bg-white/5" />
              </div>
            </div>
          ))}
          <div className="col-span-2">
            <div className="h-4 w-24 rounded bg-white/10 mb-5" />
            <div className="h-10 w-full rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomepageSkeleton() {
  return (
    <div className="w-full">
      <HeroSliderSkeleton />
      <div className="py-20 bg-cream">
        <div className="container">
          <div className="h-8 w-48 rounded bg-ink/10 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-ink/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <BrandStripSkeleton />
      <FaqSkeleton />
    </div>
  );
}
