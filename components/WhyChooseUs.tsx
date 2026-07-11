"use client";

import { useEffect, useState } from "react";

type Choice = { id: string; title: string; description: string };

/* ── Red circular icon — tyre/wheel spokes ──────────────────────── */
function FeatureIcon() {
  return (
    <div
      className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: "#ed1c24" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="22" />
        <line x1="2" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="22" y2="12" />
        <line x1="5.64" y1="5.64" x2="8.46" y2="8.46" />
        <line x1="15.54" y1="15.54" x2="18.36" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="15.54" y2="8.46" />
        <line x1="8.46" y1="15.54" x2="5.64" y2="18.36" />
      </svg>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function SkeletonItem() {
  return (
    <div className="flex gap-4 items-start animate-pulse">
      <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-white/15" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
        <div className="h-3 w-3/5 rounded bg-white/10" />
      </div>
    </div>
  );
}

/* ── Single feature row ─────────────────────────────────────────── */
function FeatureItem({ item }: { item: Choice }) {
  return (
    <div className="flex gap-4 items-start">
      <FeatureIcon />
      <div>
        <h3 className="text-white font-bold text-[15px] mb-2 leading-snug">
          {item.title}
        </h3>
        <p className="text-white/60 text-[13px] leading-[1.7]">
          {item.description}
        </p>
      </div>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────────── */
export default function WhyChooseUs() {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => { if (active) setChoices(data.whyChooseUs ?? []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  /* Two explicit columns so items 0-2 stay left and 3-5 stay right.
     CSS grid-cols-2 would interleave (0,1 / 2,3 / 4,5) — wrong order. */
  const items = loading ? Array<Choice | null>(6).fill(null) : choices;
  const left  = items.slice(0, 3);
  const right = items.slice(3, 6);

  return (
    <section className="py-20 lg:py-28 bg-black">
      <div className="container">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-[36px] font-black uppercase tracking-wide leading-tight mb-3">
            <span className="text-white">WHY DRIVERS ACROSS SAUDI ARABIA </span>
            <span className="text-[#ed1c24]">CHOOSE POWERTIRE</span>
          </h2>
          <p className="text-sm text-white/50 font-medium">
            A tyre partner built for Saudi roads
          </p>
        </div>

        {/* ── Two explicit columns ─────────────────────────────────
             Left column:  items[0..2]
             Right column: items[3..5]
             On mobile both stack into a single list.               */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-20">
          {/* Left */}
          <div className="space-y-12">
            {left.map((item, i) =>
              item === null
                ? <SkeletonItem key={i} />
                : <FeatureItem key={item.id} item={item} />
            )}
          </div>

          {/* Right */}
          <div className="space-y-12 mt-12 md:mt-0">
            {right.map((item, i) =>
              item === null
                ? <SkeletonItem key={i + 3} />
                : <FeatureItem key={item.id} item={item} />
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
